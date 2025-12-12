'use client';

import React from 'react';
import {
  Award,
  Download,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Clock,
  BookOpen,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, LearnerProgress } from '@/types';

interface CourseHeaderProps {
  course: Course;
  progress: LearnerProgress;
}

export default function CourseHeader({ course, progress }: CourseHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6" data-tour="course-header">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Course Info */}
        <div className="flex items-start gap-4">
          {/* Provider Badge */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {course.provider} Partner
              </span>
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                {course.code}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{course.name}</h1>
            <p className="text-sm text-gray-500 max-w-xl line-clamp-2">{course.description}</p>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.totalDuration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.totalModules} modules
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {course.passingScore}% to pass
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Course Selector */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
            <BookOpen className="w-4 h-4" />
            Switch Course
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Certificate */}
          {progress.certificateEarned ? (
            <button className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              Download Certificate
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg text-sm text-gray-500">
              <Award className="w-4 h-4" />
              <span>Complete course for certificate</span>
            </div>
          )}

          {/* Ask Trainer */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
            <MessageCircle className="w-4 h-4" />
            Ask Trainer
          </button>
        </div>
      </div>

      {/* Exam Voucher Banner */}
      {course.examVoucher && !course.examVoucher.isRedeemed && (
        <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Exam Voucher Included
                </p>
                <p className="text-xs text-gray-600">
                  {course.examVoucher.examName} • Expires:{' '}
                  {new Date(course.examVoucher.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
              View Voucher
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
