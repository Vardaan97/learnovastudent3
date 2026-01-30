'use client';

/**
 * Root Page - Redirects to Learnova Portal or Login
 *
 * Checks authentication status:
 * - Authenticated users go to /learnova (course selector)
 * - Unauthenticated users go to /login
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Authenticated users go to course selector
      router.replace('/learnova');
    } else {
      // Unauthenticated users go to login
      router.replace('/login');
    }
  }, [router, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading Learnova...</p>
      </div>
    </div>
  );
}
