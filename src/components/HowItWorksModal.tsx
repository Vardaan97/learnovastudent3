'use client';

import React from 'react';
import {
  X,
  BookOpen,
  PlayCircle,
  ClipboardCheck,
  Award,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  MessageCircle,
  Heart,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Access Your Courses',
    description: 'Log in to your Learnova account and navigate to your assigned courses. Your training coordinator has enrolled you in specific courses based on your learning path and career goals.',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    features: [
      'Courses assigned by your organization',
      'Progress synced across all devices',
      'Personalized learning dashboard',
    ],
  },
  {
    id: 2,
    title: 'Watch Video Lessons',
    description: 'Each module contains high-quality video lessons taught by industry experts. Watch at your own pace - your progress is automatically saved so you can resume exactly where you left off.',
    icon: PlayCircle,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    features: [
      'HD video with adjustable playback speed',
      'Auto-save progress every few seconds',
      'Resume from any device seamlessly',
    ],
  },
  {
    id: 3,
    title: 'Complete Quizzes',
    description: 'After watching video lessons, test your knowledge with interactive quizzes. Each quiz is designed to reinforce key concepts and ensure you truly understand the material before moving forward.',
    icon: ClipboardCheck,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    features: [
      'Instant feedback on your answers',
      'Retry quizzes to improve your score',
      'Earn XP and level up as you progress',
    ],
  },
  {
    id: 4,
    title: 'Practice with Qubits',
    description: 'Strengthen your knowledge with our Qubits practice system. Select modules and customize the number of practice questions to focus on areas where you need the most improvement.',
    icon: Target,
    color: 'from-teal-500 to-emerald-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    iconColor: 'text-teal-600',
    features: [
      'Randomized practice questions',
      'Track accuracy by module',
      'Focus on weak areas for improvement',
    ],
  },
  {
    id: 5,
    title: 'Earn Your Certificate',
    description: 'Complete all modules and pass the required assessments to earn your official course completion certificate. Your achievement is verified and can be shared with employers and on professional networks.',
    icon: Award,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    features: [
      'Downloadable PDF certificate',
      'Unique verification code',
      'Share on LinkedIn and social media',
    ],
  },
];

const stats = [
  { icon: Clock, label: 'Learn at your pace', value: '24/7 Access' },
  { icon: TrendingUp, label: 'Track progress', value: 'Real-time' },
  { icon: Zap, label: 'Earn rewards', value: 'XP & Badges' },
];

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">How Learnova Works</h2>
                <p className="text-sm text-cyan-100 mt-0.5">Your journey to certification made simple</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-cyan-200" />
                <div>
                  <p className="text-xs text-cyan-200">{stat.label}</p>
                  <p className="text-sm font-semibold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className={cn(
                  'rounded-xl border-2 transition-all overflow-hidden',
                  step.borderColor,
                  step.bgColor
                )}>
                  {/* Step Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg',
                          step.color
                        )}>
                          {step.id}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <step.icon className={cn('w-5 h-5', step.iconColor)} />
                          <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {step.description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2">
                          {step.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                            >
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-200 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feedback Message */}
          <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <Heart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">We&apos;re Building Something Special</h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Learnova is continuously evolving to provide you with the best learning experience possible.
                  We&apos;re working hard to add more features like interactive labs, AI-powered study assistants,
                  peer collaboration tools, and much more to make your certification journey even more valuable.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                    <MessageCircle className="w-4 h-4" />
                    <span>Your feedback matters!</span>
                  </div>
                  <a
                    href="mailto:feedback@koenig-solutions.com"
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium underline underline-offset-2"
                  >
                    Share your thoughts
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Need help? Contact <a href="mailto:support@koenig-solutions.com" className="text-cyan-600 hover:underline">support@koenig-solutions.com</a>
            </p>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
            >
              Got it, let&apos;s learn!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
