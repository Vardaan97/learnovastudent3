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
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lesson, Module } from '@/types';

interface YouTubePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  module: Module;
  courseName: string;
  onComplete: (lessonId: string) => void;
  onProgressUpdate: (lessonId: string, progress: number, position: number) => void;
  onNextLesson?: () => void;
}

// YouTube video IDs for Azure AZ-104 training (real educational content)
const YOUTUBE_VIDEO_MAP: Record<string, string> = {
  'lesson-1-1': 'pY0LnKiDwRA', // Azure AD Overview
  'lesson-1-2': 'Ma7VAQE7ga4', // Azure Users and Groups
  'lesson-1-3': '4v7ffXxOnwU', // Azure RBAC
  'lesson-1-4': 'WVNvoiA_ktw', // Azure Subscriptions
  'lesson-2-1': 'UzTtastcBsk', // Azure Storage
  'lesson-2-2': 'UzTtastcBsk', // Blob Storage
  'lesson-2-3': 'NJT8VdEfMZI', // Azure Files
  'lesson-2-4': 'X5RCHt9BPFs', // Storage Security
  'lesson-3-1': 'inaXkN2UrFE', // Azure VMs
  'lesson-3-2': 'inaXkN2UrFE', // VM Sizing
  'lesson-3-3': 'n9KGdwfqmhg', // Container Instances
  'lesson-3-4': 'MzS8_qHSPws', // App Service
  'default': 'pY0LnKiDwRA', // Default Azure overview
};

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            modestbranding?: number;
            rel?: number;
            showinfo?: number;
          };
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

export default function YouTubePlayer({
  isOpen,
  onClose,
  lesson,
  module,
  onComplete,
  onProgressUpdate,
  onNextLesson,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(lesson.progress || 0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoId = YOUTUBE_VIDEO_MAP[lesson.id] || YOUTUBE_VIDEO_MAP['default'];

  // Format time as mm:ss
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isOpen) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        setIsYouTubeReady(true);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsYouTubeReady(true);
      };
    };

    loadYouTubeAPI();
  }, [isOpen]);

  // Initialize YouTube player
  useEffect(() => {
    if (!isYouTubeReady || !isOpen) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            event.target.setVolume(volume);
            setIsPlaying(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (!hasCompleted) {
                setHasCompleted(true);
                setShowCompletion(true);
                onComplete(lesson.id);
              }
            }
          },
        },
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initPlayer, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isYouTubeReady, isOpen, videoId, volume, lesson.id, onComplete, hasCompleted]);

  // Track progress
  useEffect(() => {
    if (!isOpen || !playerRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && duration > 0) {
        const current = playerRef.current.getCurrentTime();
        const progressPercent = (current / duration) * 100;

        setCurrentTime(current);
        setProgress(progressPercent);
        onProgressUpdate(lesson.id, progressPercent, current);

        // Mark as complete when 90% watched
        if (progressPercent >= 90 && !hasCompleted) {
          setHasCompleted(true);
          setShowCompletion(true);
          onComplete(lesson.id);
        }
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, duration, lesson.id, onComplete, onProgressUpdate, hasCompleted]);

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

  // Player controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seekBy = (delta: number) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(currentTime + delta, duration));
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const seekTo = (percent: number) => {
    if (!playerRef.current || duration === 0) return;
    const newTime = (percent / 100) * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return;
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);
    if (newVolume > 0) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

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

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 bg-black/90 flex items-center justify-center z-50",
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-cyan-100 text-sm mb-0.5">
                    Module {module.number}: {module.title}
                  </p>
                  <h3 className="font-semibold text-lg">{lesson.title}</h3>
                </div>
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
          "relative bg-black",
          isFullscreen ? "h-[calc(100%-60px)]" : "aspect-video"
        )}>
          {/* YouTube Player */}
          <div id="youtube-player" className="absolute inset-0 w-full h-full" />

          {/* Overlay for controls */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={togglePlay}
          />

          {/* Completion Overlay */}
          {showCompletion && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 shadow-xl">
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

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-14 bg-gradient-to-t from-black/60 to-transparent z-10">
            <div
              className="h-1.5 bg-gray-600/50 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                seekTo(percent);
              }}
            >
              <div
                className="h-full bg-red-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => seekBy(-10)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => seekBy(10)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 accent-red-500"
                    />
                  </div>
                )}
              </div>

              <span className="text-white text-sm ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium">
                <Youtube className="w-3 h-3" />
                YouTube
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
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
