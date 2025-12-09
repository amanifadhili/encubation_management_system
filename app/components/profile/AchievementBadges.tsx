import React, { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import {
  CheckCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

interface AchievementBadgesProps {
  showAnimations?: boolean;
}

interface Badge {
  id: string;
  phase: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  color: string;
  unlocked: boolean;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  showAnimations = true,
}) => {
  const { completion } = useProfile();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!completion) return;

    const badgeConfig: Badge[] = [
      {
        id: 'phase1',
        phase: 1,
        title: 'Essential Info',
        description: 'Completed personal information',
        icon: CheckCircleIcon,
        emoji: '👤',
        color: 'blue',
        unlocked: completion.phases.phase1,
      },
      {
        id: 'phase2',
        phase: 2,
        title: 'Academic Profile',
        description: 'Completed academic information',
        icon: AcademicCapIcon,
        emoji: '🎓',
        color: 'green',
        unlocked: completion.phases.phase2,
      },
      {
        id: 'phase3',
        phase: 3,
        title: 'Professional Profile',
        description: 'Completed professional information',
        icon: BriefcaseIcon,
        emoji: '💼',
        color: 'purple',
        unlocked: completion.phases.phase3,
      },
      {
        id: 'phase5',
        phase: 5,
        title: 'Additional Info',
        description: 'Added additional notes',
        icon: DocumentTextIcon,
        emoji: '📝',
        color: 'yellow',
        unlocked: completion.phases.phase5,
      },
      {
        id: 'complete',
        phase: 0,
        title: 'Profile Complete',
        description: '100% profile completion',
        icon: TrophyIcon,
        emoji: '🏆',
        color: 'gold',
        unlocked: completion.percentage === 100,
      },
    ];

    setBadges(badgeConfig);

    // Detect newly unlocked badges
    if (showAnimations) {
      const newlyUnlockedIds = badgeConfig
        .filter((badge) => badge.unlocked)
        .map((badge) => badge.id);
      setNewlyUnlocked(newlyUnlockedIds);
    }
  }, [completion, showAnimations]);

  const getColorClasses = (color: string, unlocked: boolean, isNew: boolean) => {
    const baseClasses = 'rounded-xl border-2 p-4 transition-all duration-500';
    
    if (!unlocked) {
      return `${baseClasses} border-gray-200 bg-gray-50 opacity-50`;
    }

    const colorMap: Record<string, string> = {
      blue: isNew
        ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-200 shadow-lg scale-105'
        : 'border-blue-300 bg-blue-50',
      green: isNew
        ? 'border-green-500 bg-green-50 ring-4 ring-green-200 shadow-lg scale-105'
        : 'border-green-300 bg-green-50',
      purple: isNew
        ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-200 shadow-lg scale-105'
        : 'border-purple-300 bg-purple-50',
      yellow: isNew
        ? 'border-yellow-500 bg-yellow-50 ring-4 ring-yellow-200 shadow-lg scale-105'
        : 'border-yellow-300 bg-yellow-50',
      gold: isNew
        ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 ring-4 ring-yellow-200 shadow-lg scale-105'
        : 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50',
    };

    return `${baseClasses} ${colorMap[color] || colorMap.blue}`;
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600',
      yellow: 'text-yellow-600',
      gold: 'text-yellow-600',
    };
    return colorMap[color] || 'text-gray-600';
  };

  if (!completion) {
    return null;
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Achievement Badges</h3>
          <p className="text-sm text-gray-600 mt-1">
            {unlockedCount} of {badges.length} badges unlocked
          </p>
        </div>
        {completion.percentage === 100 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
            <TrophyIcon className="w-4 h-4" />
            <span>All Complete!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const isNew = newlyUnlocked.includes(badge.id);
          const colorClasses = getColorClasses(badge.color, badge.unlocked, isNew);

          return (
            <div
              key={badge.id}
              className={colorClasses}
              style={
                isNew && showAnimations
                  ? {
                      animation: 'pulse 2s ease-in-out',
                    }
                  : {}
              }
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    badge.unlocked
                      ? badge.color === 'gold'
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                        : `bg-${badge.color}-100`
                      : 'bg-gray-200'
                  }`}
                >
                  {badge.unlocked ? (
                    <span className="text-2xl">{badge.emoji}</span>
                  ) : (
                    <Icon className={`w-6 h-6 ${getIconColor(badge.color)} opacity-50`} />
                  )}
                </div>
                <h4
                  className={`text-xs font-semibold mb-1 ${
                    badge.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {badge.title}
                </h4>
                {badge.unlocked && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircleIcon className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Badge Progress</span>
          <span className="font-semibold text-gray-900">
            {unlockedCount}/{badges.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AchievementBadges;

