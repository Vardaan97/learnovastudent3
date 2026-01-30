'use client';

/**
 * Learnova Course Selector
 *
 * Requires authentication. Redirects to the appropriate course based on user's allowed courses.
 * - Full access users go to Python course by default
 * - Restricted users go to their first allowed course
 * - Unauthenticated users are redirected to login
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Course codes
const PYTHON_COURSE = '55284A'; // Introduction to Python
const MONGO_COURSE = '932'; // MongoDB course

export default function LearnovaCourseSelector() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Determine which course to redirect to
    let targetCourse = PYTHON_COURSE; // Default for full access users

    if (user?.allowedCourses && user.allowedCourses.length > 0) {
      // User has restricted access - redirect to their first allowed course
      targetCourse = user.allowedCourses[0];
    }

    router.replace(`/learnova/${targetCourse}`);
  }, [router, user, isAuthenticated, isLoading]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading your course...</p>
      </div>
    </div>
  );
}
