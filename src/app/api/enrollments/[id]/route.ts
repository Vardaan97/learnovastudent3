/**
 * GET /api/enrollments/[id]
 *
 * Get detailed enrollment information including lesson progress
 */

import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, notFoundResponse, forbiddenResponse } from '@/lib/api/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  // Get enrollment with course details and progress
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses (
        id,
        code,
        name,
        short_description,
        full_description,
        thumbnail_url,
        category,
        estimated_hours,
        level,
        total_lessons,
        total_modules,
        modules (
          id,
          number,
          title,
          description,
          estimated_minutes,
          sort_order,
          lessons (
            id,
            title,
            description,
            content_type,
            video_url,
            video_provider,
            video_duration,
            mux_playback_id,
            article_content,
            sort_order
          ),
          quizzes (
            id,
            title,
            description,
            time_limit_minutes,
            passing_score,
            max_attempts
          )
        )
      ),
      lesson_progress (
        id,
        lesson_id,
        status,
        progress_percent,
        last_position,
        watched_duration,
        started_at,
        completed_at
      ),
      quiz_attempts (
        id,
        quiz_id,
        score,
        passed,
        total_questions,
        correct_answers,
        attempt_number,
        completed_at
      )
    `)
    .eq('id', id)
    .single();

  if (error || !enrollment) {
    return notFoundResponse('Enrollment not found');
  }

  // Verify user owns this enrollment
  if (enrollment.user_id !== user.id) {
    return forbiddenResponse('You do not have access to this enrollment');
  }

  // Sort modules and lessons
  if (enrollment.course?.modules) {
    enrollment.course.modules.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    enrollment.course.modules.forEach((module: { lessons?: { sort_order: number }[] }) => {
      if (module.lessons) {
        module.lessons.sort((a, b) => a.sort_order - b.sort_order);
      }
    });
  }

  return jsonResponse(enrollment);
}
