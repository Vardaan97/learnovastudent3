'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Rewind,
  FastForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoProgress } from '@/hooks/useProgressSync';
import type { Lesson, Module } from '@/types';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  module: Module;
  courseName: string;
  onComplete: (lessonId: string) => void;
  onProgressUpdate: (lessonId: string, progress: number, position: number) => void;
  onNextLesson?: () => void;
}

// Parse duration string like "3:45" to seconds
const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 180; // Default 3 minutes
};

export default function VideoPlayer({
  isOpen,
  onClose,
  lesson,
  module,
  courseName,
  onComplete,
  onProgressUpdate,
  onNextLesson,
}: VideoPlayerProps) {
  const totalDuration = parseDuration(lesson.duration);

  // Hook into Supabase progress sync
  const {
    onPlay: syncOnPlay,
    onProgress: syncOnProgress,
    onComplete: syncOnComplete,
  } = useVideoProgress(lesson.id);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(lesson.lastPosition || 0);
  const [progress, setProgress] = useState(lesson.progress || 0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [buffered, setBuffered] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Format time as mm:ss
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Simulate video progress with playback speed
  useEffect(() => {
    if (!isOpen || !isPlaying || showCompletion || isDragging) return;

    // Notify Supabase sync that video is playing
    syncOnPlay();

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = Math.min(prev + (1 * playbackSpeed), totalDuration);
        const newProgress = (newTime / totalDuration) * 100;

        setProgress(newProgress);
        onProgressUpdate(lesson.id, newProgress, newTime);

        // Sync progress to Supabase (debounced in hook)
        syncOnProgress(newTime, totalDuration);

        // Simulate buffering ahead
        setBuffered(Math.min(100, newProgress + 20));

        if (newProgress >= 100) {
          setShowCompletion(true);
          onComplete(lesson.id);
          // Sync completion to Supabase
          syncOnComplete();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, showCompletion, isDragging, lesson.id, onComplete, onProgressUpdate, playbackSpeed, totalDuration, syncOnPlay, syncOnProgress, syncOnComplete]);

  // Countdown for next lesson
  useEffect(() => {
    if (!showCompletion || !onNextLesson) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onNextLesson();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showCompletion, onNextLesson]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  // Seek by delta seconds
  const seekBy = (delta: number) => {
    setCurrentTime((prev) => {
      const newTime = Math.max(0, Math.min(prev + delta, totalDuration));
      const newProgress = (newTime / totalDuration) * 100;
      setProgress(newProgress);
      onProgressUpdate(lesson.id, newProgress, newTime);
      return newTime;
    });
  };

  // Seek to specific position
  const seekTo = (position: number) => {
    const newTime = (position / 100) * totalDuration;
    setCurrentTime(newTime);
    setProgress(position);
    onProgressUpdate(lesson.id, position, newTime);
  };

  // Handle progress bar click/drag
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(Math.max(0, Math.min(100, position)));
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const time = (position / 100) * totalDuration;
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get volume icon based on level
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 bg-black/80 flex items-center justify-center z-50",
        isFullscreen ? "p-0" : "p-4"
      )}
    >
      <div className={cn(
        "bg-white overflow-hidden shadow-2xl",
        isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl rounded-2xl"
      )}>
        {/* Header */}
        {!isFullscreen && (
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm mb-0.5">
                  Module {module.number}: {module.title}
                </p>
                <h3 className="font-semibold text-lg">{lesson.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className={cn(
          "relative bg-gray-900",
          isFullscreen ? "h-full" : "aspect-video"
        )}>
          {/* Video Placeholder with animated background */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Center play/pause button */}
            {!showCompletion && (
              <div className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-white/20 hover:bg-white/30 hover:scale-110 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white ml-1" />
                  )}
                </button>
                {!isPlaying && (
                  <p className="mt-4 text-white/60 text-sm">Press Space to play</p>
                )}
              </div>
            )}

            {/* Current lesson info overlay when paused */}
            {!isPlaying && !showCompletion && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/80 text-xs">Now Playing</p>
                <p className="text-white font-medium">{lesson.title}</p>
              </div>
            )}
          </div>

          {/* Completion Overlay */}
          {showCompletion && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 shadow-xl animate-fadeIn">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Lesson Complete!
                </h4>
                <p className="text-gray-600 mb-6">
                  Great job! You&apos;ve completed &quot;{lesson.title}&quot;
                </p>

                {onNextLesson && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Next lesson starts in{' '}
                      <span className="font-bold text-cyan-600">{countdown}</span> seconds
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Back to Course
                      </button>
                      <button
                        onClick={onNextLesson}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        Next Lesson
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {!onNextLesson && (
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Continue to Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ask Trainer Button */}
          {!showCompletion && (
            <button className="absolute bottom-16 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-gray-700 text-sm font-medium hover:bg-white transition-all shadow-lg z-10">
              <MessageCircle className="w-4 h-4 text-cyan-600" />
              Ask Trainer
            </button>
          )}

          {/* Seek indicators */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => seekBy(-10)}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Rewind className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => seekBy(10)}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <FastForward className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar Container */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-14 bg-gradient-to-t from-black/60 to-transparent z-10">
            <div
              ref={progressBarRef}
              className="h-1.5 bg-gray-600/50 rounded-full cursor-pointer group"
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Buffered progress */}
              <div
                className="absolute h-1.5 bg-gray-500/50 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Actual progress */}
              <div
                className="absolute h-1.5 bg-cyan-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              {/* Hover indicator */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded"
                  style={{ left: hoverPosition }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              {/* Scrubber handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                title={isPlaying ? 'Pause (k)' : 'Play (k)'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Skip backward */}
              <button
                onClick={() => seekBy(-10)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Rewind 10s"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Skip forward */}
              <button
                onClick={() => seekBy(10)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Forward 10s"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume control */}
              <div
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                >
                  <VolumeIcon className="w-5 h-5" />
                </button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-gray-800 rounded-lg">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-20 h-1 accent-cyan-500"
                      style={{ writingMode: 'horizontal-tb' }}
                    />
                  </div>
                )}
              </div>

              {/* Time display */}
              <span className="text-white text-sm ml-2 font-mono">
                {formatTime(currentTime)} / {lesson.duration}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Playback speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg p-1 space-y-1 min-w-[80px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={cn(
                          'block w-full px-3 py-1.5 text-sm text-left rounded transition-colors',
                          playbackSpeed === speed
                            ? 'bg-cyan-600 text-white'
                            : 'text-white hover:bg-gray-700'
                        )}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <button className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
