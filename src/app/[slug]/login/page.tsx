'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { BookOpen, Shield, Award, Play, Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function CompanyLoginPage() {
  const { login, loginAsDemo, isAuthenticated, isLoading } = useAuth();
  const { theme, setCompany } = useTheme();
  const router = useRouter();
  const params = useParams();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle demo login
  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginAsDemo();
      router.push(`/${params?.slug || ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 text-white rounded-xl font-semibold transition-all shadow-lg hover:opacity-90 disabled:opacity-70"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Sign In</>}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-medium hover:underline" style={{ color: theme.primaryColor }}>
                    Sign up
                  </Link>
                </p>
              </div>

              <p className="text-xs text-center text-gray-500 mt-6">
                By signing in, you agree to our{' '}
                <a href="#" className="hover:underline" style={{ color: theme.primaryColor }}>Terms of Service</a>{' '}and{' '}
                <a href="#" className="hover:underline" style={{ color: theme.primaryColor }}>Privacy Policy</a>
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
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enter Demo Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
