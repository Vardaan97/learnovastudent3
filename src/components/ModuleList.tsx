'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  CheckCircle,
  Circle,
  Lock,
  Clock,
  HelpCircle,
  Video,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module, Lesson, Quiz } from '@/types';

interface ModuleListProps {
  modules: Module[];
  onPlayLesson: (lessonId: string, moduleId: string) => void;
  onStartQuiz: (quizId: string, moduleId: string) => void;
}

export default function ModuleList({ modules, onPlayLesson, onStartQuiz }: ModuleListProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([modules.find((m) => m.status === 'in_progress')?.id || modules[0]?.id])
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getModuleStatusIcon = (status: Module['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-cyan-500 fill-cyan-100" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getModuleStatusBadge = (status: Module['status'], progress: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
            {Math.round(progress)}% Complete
          </span>
        );
      case 'locked':
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
            Locked
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
              <p className="text-sm text-gray-500">
                {modules.length} modules • {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="divide-y divide-gray-100">
        {modules.map((module) => (
          <div key={module.id}>
            {/* Module Header */}
            <div
              className={cn(
                'flex items-center gap-4 p-4 cursor-pointer transition-colors',
                module.status === 'locked'
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => module.status !== 'locked' && toggleModule(module.id)}
            >
              <button className="text-gray-400 flex-shrink-0">
                {expandedModules.has(module.id) && module.status !== 'locked' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {getModuleStatusIcon(module.status)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900 truncate">
                    Module {module.number}: {module.title}
                  </h3>
                  {getModuleStatusBadge(module.status, module.progress)}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    {module.lessons.length} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {module.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    {module.quiz.totalQuestions} questions
                  </span>
                </div>
              </div>

              {module.status !== 'locked' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstUnwatchedLesson = module.lessons.find(
                      (l) => l.status !== 'completed'
                    );
                    if (firstUnwatchedLesson) {
                      onPlayLesson(firstUnwatchedLesson.id, module.id);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0',
                    module.status === 'completed'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                  )}
                >
                  {module.status === 'completed' ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Rewatch
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {module.status === 'in_progress' ? 'Continue' : 'Start'}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Expanded Content */}
            {expandedModules.has(module.id) && module.status !== 'locked' && (
              <div className="bg-gray-50 px-4 py-3 space-y-2">
                {/* Lessons */}
                {module.lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    onPlay={() => onPlayLesson(lesson.id, module.id)}
                  />
                ))}

                {/* Quiz */}
                <QuizItem
                  quiz={module.quiz}
                  moduleCompleted={module.lessons.every((l) => l.status === 'completed')}
                  onStart={() => onStartQuiz(module.quiz.id, module.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonItem({ lesson, onPlay }: { lesson: Lesson; onPlay: () => void }) {
  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Circle className="w-4 h-4 text-cyan-500 fill-cyan-100" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  const getButtonText = () => {
    switch (lesson.status) {
      case 'completed':
        return 'Rewatch';
      case 'in_progress':
        return 'Resume';
      default:
        return 'Watch';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100',
        lesson.status === 'locked' && 'opacity-50'
      )}
    >
      {getStatusIcon()}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{lesson.title}</p>
        {lesson.status === 'in_progress' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${lesson.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round(lesson.progress)}%</span>
          </div>
        )}
      </div>

      <span className="text-xs text-gray-500 flex-shrink-0">{lesson.duration}</span>

      {lesson.status !== 'locked' && (
        <button
          onClick={onPlay}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            lesson.status === 'completed'
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
          )}
        >
          {lesson.status === 'completed' ? (
            <RotateCcw className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {getButtonText()}
        </button>
      )}
    </div>
  );
}

function QuizItem({
  quiz,
  moduleCompleted,
  onStart,
}: {
  quiz: Quiz;
  moduleCompleted: boolean;
  onStart: () => void;
}) {
  const isLocked = quiz.status === 'locked' || !moduleCompleted;

  const getStatusBadge = () => {
    switch (quiz.status) {
      case 'passed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Passed ({quiz.bestScore}%)
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Failed - Retry
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
            In Progress
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200',
        isLocked && 'opacity-50'
      )}
    >
      <div className="p-2 bg-amber-100 rounded-lg">
        <HelpCircle className="w-4 h-4 text-amber-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {quiz.totalQuestions} questions • Pass: {quiz.passingScore}%
          {quiz.timeLimit && ` • ${quiz.timeLimit} min limit`}
        </p>
      </div>

      {isLocked ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          Complete videos first
        </div>
      ) : (
        <button
          onClick={onStart}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            quiz.status === 'passed'
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          )}
        >
          {quiz.status === 'passed' ? (
            <>
              <RotateCcw className="w-3 h-3" />
              Retake
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              {quiz.status === 'in_progress' ? 'Continue' : 'Start Quiz'}
            </>
          )}
        </button>
      )}
    </div>
  );
}
