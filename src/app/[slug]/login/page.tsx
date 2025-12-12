'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { BookOpen, Shield, Award, Play, Loader2 } from 'lucide-react';

export default function CompanyLoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { theme, setCompany } = useTheme();
  const router = useRouter();
  const params = useParams();

  // Get company slug from URL params
  const companySlug = params?.slug as string;

  // Set company theme based on URL slug
  useEffect(() => {
    if (companySlug) {
      setCompany(companySlug);
    }
  }, [companySlug, setCompany]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(`/${companySlug}`);
    }
  }, [isAuthenticated, isLoading, router, companySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  // Generate company display name
  const companyName = theme.name || (companySlug ? companySlug.charAt(0).toUpperCase() + companySlug.slice(1) : 'Company');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <div className="flex min-h-screen">
        {/* Left Panel - Features */}
        <div
          className="hidden lg:flex lg:w-1/2 text-white p-12 flex-col justify-between"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || theme.primaryColor})`
          }}
        >
          <div>
            {/* Company Logo/Name */}
            <div className="flex items-center gap-3 mb-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {companyName.charAt(0)}
              </div>
              <span className="text-2xl font-bold tracking-tight">{companyName}</span>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <h1 className="text-4xl font-bold leading-tight">
                {theme.welcomeMessage || `Welcome to ${companyName} Learning Portal`}
              </h1>
              <p className="text-white/80 text-lg">
                Accelerate your cloud career with industry-leading certification courses and hands-on labs.
              </p>

              <div className="space-y-6 mt-12">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Interactive Video Lessons</h3>
                    <p className="text-white/70 text-sm">
                      Learn from certified instructors with real-world experience
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Play className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Practice with Qubits</h3>
                    <p className="text-white/70 text-sm">
                      Randomized practice tests to prepare you for certification
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Free Exam Vouchers</h3>
                    <p className="text-white/70 text-sm">
                      Get certified with included Microsoft exam vouchers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">SCORM Compliant</h3>
                    <p className="text-white/70 text-sm">
                      Track your progress seamlessly across all devices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60">
            Powered by Koenig Solutions &copy; 2024
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {companyName.charAt(0)}
              </div>
              <span className="text-2xl font-bold text-gray-800">{companyName}</span>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-500 mt-2">Sign in to continue your learning journey</p>
              </div>

              {/* WorkOS Login Button */}
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl font-semibold transition-all shadow-lg hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Shield className="w-5 h-5" />
                Continue with WorkOS
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              {/* SSO Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={login}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button>

                <button
                  onClick={login}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Microsoft</span>
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-8">
                By signing in, you agree to our{' '}
                <a href="#" className="hover:underline" style={{ color: theme.primaryColor }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="hover:underline" style={{ color: theme.primaryColor }}>
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Demo Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 text-center">
                <strong>Demo Mode:</strong> Click any sign-in button to access the portal with a demo account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
