import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Button from '../Button';

interface WelcomeScreenProps {
  onDismiss?: () => void;
  showSkip?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onDismiss,
  showSkip = true,
}) => {
  const { completion } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !completion) {
    return null;
  }

  // Only show for new users (completion < 25%)
  if (completion.percentage >= 25) {
    return null;
  }

  const handleGetStarted = () => {
    navigate('/profile');
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleSkip = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getDisplayName = () => {
    return user?.name || 'there';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome, {getDisplayName()}! 👋</h2>
                <p className="text-blue-100 text-sm">Let's get you started</p>
              </div>
            </div>
            {showSkip && (
              <button
                onClick={handleSkip}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Skip welcome"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Complete Your Profile in 5 Easy Steps
            </h3>
            <p className="text-gray-600 mb-6">
              We'll guide you through completing your profile step by step. This will help us
              provide you with the best support and unlock all features.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {[
              { number: 1, title: 'Essential Information', time: '2-3 min', emoji: '👤' },
              { number: 2, title: 'Academic Profile', time: '3-4 min', emoji: '🎓' },
              { number: 3, title: 'Professional Profile', time: '5-7 min', emoji: '💼' },
              { number: 4, title: 'Project Information', time: '7-10 min', emoji: '🚀' },
              { number: 5, title: 'Additional Info (Optional)', time: '2-3 min', emoji: '📝' },
            ].map((step) => (
              <div
                key={step.number}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {step.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Phase {step.number}</span>
                    <span className="text-xs text-gray-500">({step.time})</span>
                  </div>
                  <p className="text-sm text-gray-600">{step.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">✨ What you'll unlock:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                Access to all platform features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                Personalized support and recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                Better matching with mentors and resources
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                Project creation and team management
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="flex-1 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRightIcon className="w-5 h-5" />
            </Button>
            {showSkip && (
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1"
              >
                I'll do this later
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

