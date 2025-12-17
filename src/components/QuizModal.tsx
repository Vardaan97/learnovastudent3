'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressSync } from '@/hooks/useProgressSync';
import type { Quiz, QuizQuestion } from '@/types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  moduleTitle: string;
  onSubmit: (score: number, answers: Record<string, string[]>) => void;
  onReviewVideo: () => void;
}

type QuizState = 'taking' | 'reviewing' | 'results';

export default function QuizModal({
  isOpen,
  onClose,
  quiz,
  moduleTitle,
  onSubmit,
  onReviewVideo,
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [quizState, setQuizState] = useState<QuizState>('taking');
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
  const [score, setScore] = useState(0);
  const [quizStartTime] = useState(new Date());

  // Hook for syncing quiz attempts to Supabase
  const { saveQuizAttempt } = useProgressSync();

  // Timer
  useEffect(() => {
    if (!isOpen || quizState !== 'taking' || !quiz.timeLimit) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, quizState, quiz.timeLimit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.questionType === 'multiple') {
      const current = answers[questionId] || [];
      const newAnswers = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: [optionId] });
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;

    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id] || [];
      const correctAnswers = question.correctOptionIds;

      const isCorrect =
        userAnswer.length === correctAnswers.length &&
        userAnswer.every((id) => correctAnswers.includes(id));

      if (isCorrect) correctCount++;
    });

    const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = calculatedScore >= (quiz.passingScore || 70);
    const durationSeconds = Math.floor((Date.now() - quizStartTime.getTime()) / 1000);

    setScore(calculatedScore);
    setQuizState('results');
    onSubmit(calculatedScore, answers);

    // Sync quiz attempt to Supabase
    saveQuizAttempt(
      quiz.id,
      calculatedScore,
      passed,
      quiz.questions.length,
      correctCount,
      answers,
      quizStartTime,
      durationSeconds
    );
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
    setQuizState('taking');
  };

  if (!isOpen) return null;

  const question = quiz.questions[currentQuestion];
  const isAnswered = answers[question?.id]?.length > 0;
  const totalAnswered = Object.keys(answers).length;
  const passed = score >= quiz.passingScore;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm mb-0.5">{moduleTitle}</p>
              <h3 className="font-semibold">{quiz.title}</h3>
            </div>
            <div className="flex items-center gap-4">
              {quiz.timeLimit && quizState === 'taking' && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {quizState === 'results' ? (
          /* Results View */
          <div className="p-8 text-center">
            <div
              className={cn(
                'w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center',
                passed ? 'bg-green-100' : 'bg-red-100'
              )}
            >
              {passed ? (
                <Award className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {passed
                ? "You've successfully passed the knowledge check."
                : "You didn't pass this time, but don't give up!"}
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-gray-900">{score}%</p>
                <p className="text-xs text-gray-500">Your Score</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-gray-900">{quiz.passingScore}%</p>
                <p className="text-xs text-gray-500">Passing Score</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">
                  {Object.keys(answers).filter((qId) => {
                    const q = quiz.questions.find((qu) => qu.id === qId);
                    if (!q) return false;
                    const userAns = answers[qId] || [];
                    return (
                      userAns.length === q.correctOptionIds.length &&
                      userAns.every((id) => q.correctOptionIds.includes(id))
                    );
                  }).length}
                  /{quiz.questions.length}
                </p>
                <p className="text-xs text-gray-500">Correct</p>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setQuizState('reviewing')}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Review Answers
              </button>
              {!passed && (
                <>
                  <button
                    onClick={onReviewVideo}
                    className="flex items-center gap-2 px-5 py-2.5 border border-cyan-200 text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Review Video
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Quiz
                  </button>
                </>
              )}
              {passed && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Continue
                </button>
              )}
            </div>
          </div>
        ) : quizState === 'reviewing' ? (
          /* Review View */
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Review</h3>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {quiz.questions.map((q, idx) => {
                const userAnswer = answers[q.id] || [];
                const isCorrect =
                  userAnswer.length === q.correctOptionIds.length &&
                  userAnswer.every((id) => q.correctOptionIds.includes(id));

                return (
                  <div
                    key={q.id}
                    className={cn(
                      'p-4 rounded-xl border-2',
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-gray-900">
                        {idx + 1}. {q.questionText}
                      </p>
                    </div>
                    <div className="ml-8 space-y-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'p-2 rounded-lg text-sm',
                            opt.isCorrect && 'bg-green-100 text-green-700',
                            !opt.isCorrect &&
                              userAnswer.includes(opt.id) &&
                              'bg-red-100 text-red-700',
                            !opt.isCorrect &&
                              !userAnswer.includes(opt.id) &&
                              'bg-white text-gray-600'
                          )}
                        >
                          {opt.text}
                          {opt.isCorrect && (
                            <span className="ml-2 text-xs font-medium">(Correct)</span>
                          )}
                          {!opt.isCorrect && userAnswer.includes(opt.id) && (
                            <span className="ml-2 text-xs font-medium">(Your answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="mt-3 ml-8 text-sm text-gray-600 bg-white/50 p-2 rounded-lg">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setQuizState('results')}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Results
              </button>
            </div>
          </div>
        ) : (
          /* Taking Quiz View */
          <>
            {/* Progress */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </span>
                <span>{totalAnswered} answered</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-6">
              <p className="text-lg font-medium text-gray-900 mb-6">
                {currentQuestion + 1}. {question.questionText}
              </p>

              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = answers[question.id]?.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                      )}
                    >
                      <input
                        type={question.questionType === 'multiple' ? 'checkbox' : 'radio'}
                        name={question.id}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(question.id, option.id)}
                        className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
                      />
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  );
                })}
              </div>

              {question.questionType === 'multiple' && (
                <p className="mt-3 text-sm text-gray-500">
                  Select all answers that apply
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentQuestion === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-2">
                {quiz.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={cn(
                      'w-8 h-8 rounded-full text-xs font-medium transition-colors',
                      idx === currentQuestion
                        ? 'bg-amber-500 text-white'
                        : answers[quiz.questions[idx].id]?.length > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Submit Quiz
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentQuestion((prev) =>
                      Math.min(quiz.questions.length - 1, prev + 1)
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
