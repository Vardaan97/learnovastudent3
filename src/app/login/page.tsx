'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Shield, Award, Play, Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const { login, loginAsDemo, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    console.log('[Login Page] Attempting login for:', email);

    try {
      await login(email, password);
      console.log('[Login Page] Login successful, redirecting...');
      // Auth state change will trigger redirect via useEffect
    } catch (err) {
      console.error('[Login Page] Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle demo login (no credentials needed)
  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    console.log('[Login Page] Entering demo mode...');

    try {
      await loginAsDemo();
      console.log('[Login Page] Demo mode activated, redirecting...');
      // Use window.location for a hard redirect to ensure state is picked up
      window.location.href = '/';
    } catch (err) {
      console.error('[Login Page] Demo mode error:', err);
      setError(err instanceof Error ? err.message : 'Demo login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <div className="flex min-h-screen">
        {/* Left Panel - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600 to-blue-700 text-white p-12 flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-16">
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-white">K</span>
                <span className="text-cyan-200">O</span>
                <span className="text-white">ENIG</span>
              </span>
              <span className="text-cyan-200 text-lg font-medium">Learnova</span>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <h1 className="text-4xl font-bold leading-tight">
                Master Azure with Expert-Led Training
              </h1>
              <p className="text-cyan-100 text-lg">
                Accelerate your cloud career with industry-leading certification courses and hands-on labs.
              </p>

              <div className="space-y-6 mt-12">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Interactive Video Lessons</h3>
                    <p className="text-cyan-100 text-sm">
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
                    <p className="text-cyan-100 text-sm">
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
                    <p className="text-cyan-100 text-sm">
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
                    <p className="text-cyan-100 text-sm">
                      Track your progress seamlessly across all devices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-cyan-200">
            &copy; 2024 Koenig Solutions. All rights reserved.
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-12">
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-cyan-600">K</span>
                <span className="text-gray-400">O</span>
                <span className="text-cyan-600">ENIG</span>
              </span>
              <span className="text-gray-500 text-lg font-medium">Learnova</span>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-500 mt-2">Sign in to continue your learning journey</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-200/50 hover:shadow-cyan-300/50 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-cyan-600 hover:text-cyan-700 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>

              <p className="text-xs text-center text-gray-500 mt-6">
                By signing in, you agree to our{' '}
                <a href="#" className="text-cyan-600 hover:text-cyan-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-cyan-600 hover:text-cyan-700">
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Demo Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 text-center mb-3">
                <strong>Demo Mode:</strong> Try the portal without credentials
              </p>
              <button
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Enter Demo Mode'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
