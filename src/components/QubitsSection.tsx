'use client';

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Share2,
  Award,
  Target,
  Flame,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QubitsModule, QubitsDashboard } from '@/types';

interface QubitsSectionProps {
  modules: QubitsModule[];
  dashboard: QubitsDashboard;
  onStartTest: (moduleIds: string[], questionCounts: Record<string, number>) => void;
  onReset: () => void;
  onShareAchievement?: () => void;
  onRequestBadge?: () => void;
}

export default function QubitsSection({
  modules: initialModules,
  dashboard,
  onStartTest,
  onReset,
  onShareAchievement,
  onRequestBadge,
}: QubitsSectionProps) {
  const [modules, setModules] = useState(initialModules);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    initialModules.forEach((m) => {
      counts[m.id] = m.questionsToAttempt;
    });
    return counts;
  });

  const selectedModules = modules.filter((m) => m.isSelected);
  const totalQuestionsSelected = selectedModules.reduce(
    (acc, m) => acc + (questionCounts[m.id] || 10),
    0
  );

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, isSelected: !m.isSelected } : m))
    );
  };

  const selectAll = () => {
    const allSelected = modules.every((m) => m.isSelected);
    setModules((prev) => prev.map((m) => ({ ...m, isSelected: !allSelected })));
  };

  const adjustCount = (moduleId: string, delta: number) => {
    setQuestionCounts((prev) => {
      const module = modules.find((m) => m.id === moduleId);
      const max = module?.unattempted || 10;
      const current = prev[moduleId] || 10;
      const newVal = Math.max(1, Math.min(max, current + delta));
      return { ...prev, [moduleId]: newVal };
    });
  };

  const handleStartTest = () => {
    const selectedIds = selectedModules.map((m) => m.id);
    onStartTest(selectedIds, questionCounts);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Qubits Practice Tests</h2>
            <p className="text-cyan-100 text-sm">
              Practice makes perfect. Test your knowledge with randomized questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            <button
              onClick={onShareAchievement}
              className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Achievement
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-cyan-200" />
            <p className="text-2xl font-bold">{dashboard.overallAccuracy}%</p>
            <p className="text-xs text-cyan-200">Accuracy</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <CheckSquare className="w-6 h-6 mx-auto mb-2 text-cyan-200" />
            <p className="text-2xl font-bold">{dashboard.totalQuestionsAttempted}</p>
            <p className="text-xs text-cyan-200">Questions</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-cyan-200" />
            <p className="text-2xl font-bold">{dashboard.timeSpent}</p>
            <p className="text-xs text-cyan-200">Time Spent</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-300" />
            <p className="text-2xl font-bold">{dashboard.streak}</p>
            <p className="text-xs text-cyan-200">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between">
        <button
          onClick={selectAll}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {modules.every((m) => m.isSelected) ? (
            <CheckSquare className="w-5 h-5 text-cyan-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">Select All Modules</span>
        </button>

        {selectedModules.length > 0 && (
          <button
            onClick={handleStartTest}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Practice ({totalQuestionsSelected} Questions)
          </button>
        )}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <div
            key={module.id}
            className={cn(
              'bg-white rounded-xl border-2 p-5 transition-all',
              module.isSelected ? 'border-cyan-500 shadow-lg shadow-cyan-100' : 'border-gray-200'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                {module.subtitle && (
                  <p className="text-sm text-gray-500">{module.subtitle}</p>
                )}
              </div>
              <button onClick={() => toggleModule(module.id)}>
                {module.isSelected ? (
                  <CheckSquare className="w-5 h-5 text-cyan-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-lg font-bold text-cyan-600">{module.totalQuestions}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-500">{module.unattempted}</p>
                <p className="text-xs text-gray-500">Unattempted</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Accuracy</span>
                <span
                  className={cn(
                    'font-semibold',
                    module.accuracy >= 70 ? 'text-green-600' : 'text-amber-600'
                  )}
                >
                  {module.accuracy}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    module.accuracy >= 70 ? 'bg-green-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${module.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {module.correctAnswers}/{module.attemptedQuestions} correct
              </p>
            </div>

            {/* Question Count Selector */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
              <span className="text-sm text-gray-600">Questions to attempt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustCount(module.id, -1)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <span className="w-8 text-center font-semibold text-gray-900">
                  {questionCounts[module.id]}
                </span>
                <button
                  onClick={() => adjustCount(module.id, 1)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => onStartTest([module.id], { [module.id]: questionCounts[module.id] })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Test
            </button>
          </div>
        ))}
      </div>

      {/* Achievement Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Award className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Request Your Acclaim Badge</h3>
            <p className="text-sm text-gray-600">
              Achieved 80%+ accuracy? Share your accomplishment on LinkedIn!
            </p>
          </div>
          <button
            onClick={onRequestBadge}
            className="ml-auto px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Request Badge
          </button>
        </div>
      </div>
    </div>
  );
}
