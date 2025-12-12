'use client';

import React from 'react';
import { BookOpen, Target, FileText, MessageCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabId } from '@/types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  certificateEarned: boolean;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'course', label: 'Course Content', icon: BookOpen },
  { id: 'qubits', label: 'Qubits Practice', icon: Target },
  { id: 'resources', label: 'Resources', icon: FileText },
  { id: 'support', label: 'Ask Trainer', icon: MessageCircle },
  { id: 'certificate', label: 'Certificate', icon: Award },
];

export default function TabNavigation({
  activeTab,
  onTabChange,
  certificateEarned,
}: TabNavigationProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6" data-tour="tabs">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'certificate' && certificateEarned && (
                <span className="w-2 h-2 bg-green-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
