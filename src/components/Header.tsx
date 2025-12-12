'use client';

import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  BookOpen,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { LearnerProfile, Notification } from '@/types';

interface HeaderProps {
  learner: LearnerProfile;
  notifications: Notification[];
  onMarkNotificationRead?: (id: string) => void;
}

export default function Header({ learner, notifications, onMarkNotificationRead }: HeaderProps) {
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-cyan-600">K</span>
                <span className="text-gray-400">O</span>
                <span className="text-cyan-600">ENIG</span>
              </span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <span className="hidden sm:block text-sm text-gray-500 font-medium">
              Learning Portal
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-full hover:bg-cyan-700 transition-colors">
              <BookOpen className="w-4 h-4" />
              My Courses
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <Play className="w-4 h-4" />
              How It Works
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              Help & FAQ
            </button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
                          !notif.isRead && 'bg-cyan-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                              notif.type === 'success' && 'bg-green-500',
                              notif.type === 'warning' && 'bg-amber-500',
                              notif.type === 'info' && 'bg-blue-500',
                              notif.type === 'reminder' && 'bg-cyan-500'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-100">
                    <button className="w-full py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">ID: {learner.learnerId}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {learner.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{learner.name}</p>
                    <p className="text-xs text-gray-500">{learner.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      Help Center
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
