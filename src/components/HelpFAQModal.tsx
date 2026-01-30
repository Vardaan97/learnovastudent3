'use client';

import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  ChevronDown,
  Key,
  Award,
  MessageCircle,
  Monitor,
  BarChart3,
  Mail,
  PlayCircle,
  RefreshCw,
  Smartphone,
  Globe,
  Shield,
  Clock,
  FileText,
  Search,
  ExternalLink,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: 'all', label: 'All Topics', icon: HelpCircle },
  { id: 'account', label: 'Account', icon: Key },
  { id: 'learning', label: 'Learning', icon: PlayCircle },
  { id: 'technical', label: 'Technical', icon: Monitor },
];

const faqs = [
  {
    id: 'password',
    category: 'account',
    question: 'How do I reset my password?',
    answer: `To reset your password, follow these steps:

1. Click on the "Forgot Password" link on the login page
2. Enter your registered email address
3. Check your inbox for a password reset link (also check spam/junk folder)
4. Click the link and create a new password

If you don't receive the email within 5 minutes, please contact your training coordinator or our support team.`,
    icon: Key,
    tags: ['password', 'login', 'access'],
  },
  {
    id: 'certificate',
    category: 'learning',
    question: 'How do I download my certificate?',
    answer: `Your certificate becomes available after completing all requirements:

1. Complete all video lessons in every module
2. Pass all module quizzes with a score of 70% or higher
3. Go to the "Certificate" tab in your course dashboard
4. Click "Download Certificate" to get your PDF

Each certificate includes:
- Your full name and the course title
- Completion date and certificate number
- A unique QR code for verification
- Koenig Solutions official seal`,
    icon: Award,
    tags: ['certificate', 'download', 'completion'],
  },
  {
    id: 'progress-save',
    category: 'learning',
    question: 'Is my progress automatically saved?',
    answer: `Yes! Learnova automatically saves your progress in real-time:

- Video progress: Saved every few seconds while watching
- Quiz answers: Saved immediately when you submit
- Course progress: Updates instantly as you complete content

You can close the browser or switch devices at any time - your progress will be there when you return. Just make sure you're logged in with the same account.`,
    icon: RefreshCw,
    tags: ['progress', 'save', 'sync'],
  },
  {
    id: 'trainer',
    category: 'learning',
    question: 'How do I contact my trainer?',
    answer: `You have multiple ways to reach your trainer:

1. **Support Tab**: Go to the "Ask Trainer" tab in your course dashboard to send a message directly
2. **Email**: Your trainer's email is displayed in the Support section
3. **Response Time**: Trainers typically respond within 24 hours on business days

For urgent technical issues, please contact our support team directly at support@koenig-solutions.com`,
    icon: MessageCircle,
    tags: ['trainer', 'contact', 'help', 'support'],
  },
  {
    id: 'browsers',
    category: 'technical',
    question: 'What browsers and devices are supported?',
    answer: `Learnova works on most modern browsers and devices:

**Recommended Browsers:**
- Google Chrome (latest version) - Best experience
- Mozilla Firefox (latest version)
- Microsoft Edge (Chromium-based)
- Safari (macOS and iOS)

**Supported Devices:**
- Desktop/Laptop computers
- Tablets (iPad, Android tablets)
- Smartphones (for progress tracking; video watching recommended on larger screens)

**Requirements:**
- JavaScript must be enabled
- Stable internet connection (minimum 2 Mbps for video streaming)
- Allow pop-ups for certificate downloads`,
    icon: Monitor,
    tags: ['browser', 'device', 'compatibility', 'mobile'],
  },
  {
    id: 'progress',
    category: 'learning',
    question: 'How do I track my progress?',
    answer: `Learnova provides comprehensive progress tracking:

**Dashboard Overview:**
- Overall completion percentage at the top
- Time spent learning
- Modules and lessons completed

**Progress Sidebar:**
- Detailed breakdown by module
- Quiz scores and attempts
- Qubits practice accuracy

**Course Content Tab:**
- Individual lesson completion status
- Video watch percentage
- Quiz pass/fail indicators

Your progress syncs across all devices automatically when you're logged in.`,
    icon: BarChart3,
    tags: ['progress', 'tracking', 'dashboard'],
  },
  {
    id: 'video-issues',
    category: 'technical',
    question: 'Video is not playing or buffering. What should I do?',
    answer: `If you're experiencing video playback issues, try these steps:

1. **Check your internet connection** - Videos require stable bandwidth
2. **Refresh the page** - Sometimes a simple refresh fixes the issue
3. **Clear browser cache** - Go to browser settings and clear cached data
4. **Try a different browser** - Chrome usually works best
5. **Disable browser extensions** - Ad blockers can sometimes interfere
6. **Lower video quality** - If available, try a lower resolution

If issues persist, note the specific video/lesson name and contact support with details about your browser and device.`,
    icon: PlayCircle,
    tags: ['video', 'playback', 'buffering', 'streaming'],
  },
  {
    id: 'quiz-retake',
    category: 'learning',
    question: 'Can I retake a quiz if I fail?',
    answer: `Yes, you can retake quizzes! Here's how it works:

- **Failed quizzes**: You can retry immediately
- **No attempt limit**: Most quizzes allow unlimited retakes
- **Best score kept**: Your highest score is always recorded
- **Review option**: After failing, you can review the video lessons before retrying

**Tips for success:**
- Watch the video lessons completely before attempting the quiz
- Take notes on key concepts
- Use the Qubits practice section to reinforce learning`,
    icon: RefreshCw,
    tags: ['quiz', 'retake', 'fail', 'retry'],
  },
  {
    id: 'mobile-access',
    category: 'technical',
    question: 'Can I access Learnova on my mobile phone?',
    answer: `Yes, Learnova is mobile-friendly! However, we recommend:

**Best for mobile:**
- Checking your progress
- Reading course materials
- Quick quiz practice with Qubits

**Better on desktop/tablet:**
- Watching video lessons (larger screen = better learning)
- Taking module quizzes
- Downloading certificates

Your progress syncs automatically between devices, so you can start on desktop and check progress on mobile anytime.`,
    icon: Smartphone,
    tags: ['mobile', 'phone', 'tablet', 'app'],
  },
  {
    id: 'offline',
    category: 'technical',
    question: 'Can I access courses offline?',
    answer: `Currently, Learnova requires an internet connection to:

- Stream video lessons
- Save your progress
- Submit quiz answers
- Access course materials

**We're working on:**
- Downloadable video lessons for offline viewing
- Offline quiz mode with sync when online
- PDF course materials for offline reading

Stay tuned for these features in upcoming updates!`,
    icon: Globe,
    tags: ['offline', 'download', 'internet'],
  },
  {
    id: 'data-privacy',
    category: 'account',
    question: 'How is my learning data protected?',
    answer: `Your privacy and data security are our top priorities:

**Data Protection:**
- All data encrypted in transit and at rest
- Secure authentication with industry standards
- No sharing of personal data with third parties

**What we collect:**
- Course progress and completion data
- Quiz scores and attempts
- Time spent on learning activities

**Your rights:**
- Request your data anytime
- Delete your account and data
- Opt out of non-essential communications

For detailed information, please review our Privacy Policy.`,
    icon: Shield,
    tags: ['privacy', 'data', 'security', 'GDPR'],
  },
  {
    id: 'support',
    category: 'technical',
    question: 'Who do I contact for technical issues?',
    answer: `For technical support, you have several options:

**Email Support:**
support@koenig-solutions.com
Response time: Within 24 hours on business days

**When contacting support, please include:**
- Your learner ID (shown in your profile)
- Course name and specific lesson/module
- Browser and device information
- Screenshot of any error messages
- Steps to reproduce the issue

**For urgent issues:**
Contact your training coordinator who can escalate to our technical team.`,
    icon: Headphones,
    tags: ['support', 'technical', 'help', 'contact'],
  },
];

export default function HelpFAQModal({ isOpen, onClose }: HelpFAQModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>('password');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Help & FAQ</h2>
                <p className="text-sm text-amber-100 mt-0.5">Find answers to common questions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  selectedCategory === category.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                <category.icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable FAQ Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No matching questions found</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or browse all topics</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={cn(
                    'border rounded-xl overflow-hidden transition-all',
                    expandedId === faq.id
                      ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg transition-colors flex-shrink-0',
                        expandedId === faq.id ? 'bg-amber-100' : 'bg-gray-100'
                      )}>
                        <faq.icon className={cn(
                          'w-4 h-4',
                          expandedId === faq.id ? 'text-amber-600' : 'text-gray-500'
                        )} />
                      </div>
                      <span className={cn(
                        'font-medium',
                        expandedId === faq.id ? 'text-amber-700' : 'text-gray-900'
                      )}>
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform text-gray-400',
                      expandedId === faq.id && 'rotate-180 text-amber-600'
                    )} />
                  </button>

                  {expandedId === faq.id && (
                    <div className="px-4 pb-4">
                      <div className="pl-11 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                      {/* Tags */}
                      <div className="pl-11 mt-3 flex flex-wrap gap-1.5">
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                Still need help?
              </p>
              <a
                href="mailto:support@koenig-solutions.com"
                className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                Contact Support
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button
              onClick={onClose}
              className="py-2 px-5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
