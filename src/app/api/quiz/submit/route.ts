/**
 * POST /api/quiz/submit
 *
 * Submit quiz answers and get results
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  parseBody,
  jsonResponse,
  errorResponse,
  forbiddenResponse,
} from '@/lib/api/utils';

const submitQuizSchema = z.object({
  enrollmentId: z.string().uuid(),
  quizId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedAnswers: z.array(z.string()),
  })),
  durationSeconds: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { data: body, error: validationError } = await parseBody(request, submitQuizSchema);
  if (validationError) return validationError;

  // Verify enrollment belongs to user
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .eq('id', body.enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    return errorResponse('Enrollment not found', 404, 'NOT_FOUND');
  }

  if (enrollment.user_id !== user.id) {
    return forbiddenResponse('You do not have access to this enrollment');
  }

  // Get quiz with questions
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select(`
      id,
      passing_score,
      max_attempts,
      show_correct_answers,
      questions (
        id,
        question_text,
        question_type,
        options,
        correct_answers,
        points
      )
    `)
    .eq('id', body.quizId)
    .single();

  if (quizError || !quiz) {
    return errorResponse('Quiz not found', 404, 'NOT_FOUND');
  }

  // Check max attempts
  if (quiz.max_attempts) {
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', body.enrollmentId)
      .eq('quiz_id', body.quizId);

    if ((attemptCount ?? 0) >= quiz.max_attempts) {
      return errorResponse('Maximum attempts reached', 400, 'MAX_ATTEMPTS');
    }
  }

  // Grade the quiz
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers: Array<{
    questionId: string;
    selectedAnswers: string[];
    isCorrect: boolean;
    correctAnswers?: string[];
  }> = [];

  for (const answer of body.answers) {
    const question = quiz.questions.find((q: { id: string }) => q.id === answer.questionId);
    if (!question) continue;

    totalPoints += question.points;

    // Check if answer is correct
    const correctAnswers = question.correct_answers as string[];
    const selectedSet = new Set(answer.selectedAnswers);
    const correctSet = new Set(correctAnswers);

    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((x) => correctSet.has(x));

    if (isCorrect) {
      earnedPoints += question.points;
    }

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedAnswers: answer.selectedAnswers,
      isCorrect,
      correctAnswers: quiz.show_correct_answers ? correctAnswers : undefined,
    });
  }

  // Calculate score percentage
  const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = scorePercent >= quiz.passing_score;

  // Get attempt number
  const { count: previousAttempts } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_id', body.enrollmentId)
    .eq('quiz_id', body.quizId);

  const attemptNumber = (previousAttempts ?? 0) + 1;

  // Save quiz attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      enrollment_id: body.enrollmentId,
      quiz_id: body.quizId,
      score: scorePercent,
      passed,
      total_questions: quiz.questions.length,
      correct_answers: gradedAnswers.filter((a) => a.isCorrect).length,
      answers: gradedAnswers,
      duration_seconds: body.durationSeconds,
      attempt_number: attemptNumber,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (attemptError) {
    return errorResponse('Failed to save quiz attempt', 500, 'SAVE_ERROR');
  }

  return jsonResponse({
    attemptId: attempt.id,
    score: scorePercent,
    passed,
    totalQuestions: quiz.questions.length,
    correctAnswers: gradedAnswers.filter((a) => a.isCorrect).length,
    attemptNumber,
    passingScore: quiz.passing_score,
    answers: quiz.show_correct_answers ? gradedAnswers : undefined,
  });
}
