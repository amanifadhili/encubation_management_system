import React, { useState, useEffect } from 'react';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { CompletionProgressBar } from '../components/profile/CompletionProgressBar';
import { PhaseCard } from '../components/profile/PhaseCard';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { AchievementBadges } from '../components/profile/AchievementBadges';
import { AutoSaveIndicator } from '../components/profile/AutoSaveIndicator';
import {
  Phase1Form,
  Phase2Form,
  Phase3Form,
  Phase5Form,
} from '../components/profile';
import { useToast } from '../components/Layout';
import {
  UserCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { PageSkeleton } from '../components/loading';

// Phase configuration
// Note: Phase 4 (Project Information) has been moved to the Projects page
const phaseConfig = [
  {
    number: 1,
    title: 'Essential Information',
    description: 'Personal identity and contact information',
    icon: UserCircleIcon,
    emoji: '👤',
    estimatedTime: '2-3 minutes',
    required: true,
  },
  {
    number: 2,
    title: 'Academic Profile',
    description: 'Educational background and enrollment status',
    icon: AcademicCapIcon,
    emoji: '🎓',
    estimatedTime: '3-4 minutes',
    required: true,
  },
  {
    number: 3,
    title: 'Professional Profile',
    description: 'Role, skills, and support interests',
    icon: BriefcaseIcon,
    emoji: '💼',
    estimatedTime: '5-7 minutes',
    required: true,
  },
  {
    number: 5,
    title: 'Additional Information',
    description: 'Optional additional context',
    icon: DocumentTextIcon,
    emoji: '📝',
    estimatedTime: '2-3 minutes',
    required: false,
  },
];

const ProfileContent: React.FC = () => {
  const { profile, completion, loading, refreshProfile, refreshCompletion } = useProfile();
  const showToast = useToast();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [activePhase, setActivePhase] = useState<number | null>(null);

  useEffect(() => {
    refreshProfile();
    refreshCompletion();
  }, []);

  useEffect(() => {
    // Auto-expand first incomplete phase
    if (completion && !loading) {
      const firstIncomplete = phaseConfig.findIndex(
        (phase) => !completion.phases[`phase${phase.number}` as keyof typeof completion.phases]
      );
      if (firstIncomplete !== -1) {
        setExpandedPhase(phaseConfig[firstIncomplete].number);
        setActivePhase(phaseConfig[firstIncomplete].number);
      } else {
        // All phases complete, expand Phase 1 by default
        setExpandedPhase(1);
      }
    }
  }, [completion, loading]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!profile || !completion) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">Failed to load profile data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const isPhaseLocked = (phaseNumber: number): boolean => {
    if (phaseNumber === 1) return false; // Phase 1 is always unlocked
    if (phaseNumber === 5) return false; // Phase 5 is optional and always unlocked
    
    // Check if previous phase is complete
    // Note: Phase 4 is skipped, so Phase 5 unlocks after Phase 3
    const previousPhase = phaseNumber === 5 ? 3 : phaseNumber - 1;
    return !completion.phases[`phase${previousPhase}` as keyof typeof completion.phases];
  };

  const isPhaseComplete = (phaseNumber: number): boolean => {
    return completion.phases[`phase${phaseNumber}` as keyof typeof completion.phases] || false;
  };

  const handlePhaseComplete = async (phaseNumber: number) => {
    await refreshProfile();
    await refreshCompletion();
    showToast(`Phase ${phaseNumber} completed successfully!`, 'success');
    
    // Auto-expand next phase if available
    // Note: Phase 4 is skipped, so after Phase 3, go to Phase 5
    let nextPhase = phaseNumber + 1;
    if (nextPhase === 4) {
      nextPhase = 5; // Skip Phase 4, go to Phase 5
    }
    if (nextPhase <= 5) {
      setTimeout(() => {
        setExpandedPhase(nextPhase);
        setActivePhase(nextPhase);
      }, 500);
    }
  };

  const handlePhaseClick = (phaseNumber: number) => {
    if (!isPhaseLocked(phaseNumber)) {
      setExpandedPhase(phaseNumber);
      setActivePhase(phaseNumber);
    }
  };

  const renderPhaseContent = (phaseNumber: number) => {
    switch (phaseNumber) {
      case 1:
        return <Phase1Form onComplete={() => handlePhaseComplete(1)} />;
      case 2:
        return <Phase2Form onComplete={() => handlePhaseComplete(2)} />;
      case 3:
        return <Phase3Form onComplete={() => handlePhaseComplete(3)} />;
      case 5:
        return <Phase5Form onComplete={() => handlePhaseComplete(5)} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader
        onEditClick={() => {
          // Scroll to first incomplete phase or Phase 1
          const firstIncomplete = phaseConfig.findIndex(
            (phase) => !completion.phases[`phase${phase.number}` as keyof typeof completion.phases]
          );
          const targetPhase = firstIncomplete !== -1 ? phaseConfig[firstIncomplete].number : 1;
          setExpandedPhase(targetPhase);
          setActivePhase(targetPhase);
          // Smooth scroll to phase
          setTimeout(() => {
            const element = document.getElementById(`phase-${targetPhase}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
      />

      {/* Auto-Save Indicator */}
      <div className="flex justify-end">
        <AutoSaveIndicator />
      </div>

      {/* Achievement Badges */}
      <AchievementBadges showAnimations={true} />

      {/* Completion Progress Bar */}
      <CompletionProgressBar
        percentage={completion.percentage}
        phases={completion.phases}
        showPhaseBreakdown={true}
      />

      {/* Welcome Message for New Users */}
      {completion.percentage < 25 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome! Let's get started
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Complete your profile in phases to unlock all features. Start with Phase 1 to begin your journey.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span>💡</span>
                <span>Each phase takes just a few minutes to complete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Cards */}
      <div className="space-y-4">
        {phaseConfig.map((phase) => {
          const phaseId = `phase-${phase.number}`;
          const Icon = phase.icon;
          const locked = isPhaseLocked(phase.number);
          const completed = isPhaseComplete(phase.number);
          const isExpanded = expandedPhase === phase.number;

          return (
            <div key={phase.number} id={phaseId}>
              <PhaseCard
                phaseNumber={phase.number}
              title={phase.title}
              description={phase.description}
              icon={<Icon className="w-6 h-6" />}
              completed={completed}
              locked={locked}
              estimatedTime={phase.estimatedTime}
              collapsible={true}
              defaultExpanded={isExpanded}
              onContinue={() => handlePhaseClick(phase.number)}
            >
              {locked ? (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 text-gray-600">
                    <LockClosedIcon className="w-6 h-6" />
                    <div>
                      <p className="font-medium">
                        This phase is locked
                      </p>
                      <p className="text-sm mt-1">
                        Complete Phase {phase.number - 1} to unlock this phase
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {renderPhaseContent(phase.number)}
                </div>
              )}
              </PhaseCard>
            </div>
          );
        })}
      </div>

      {/* Completion Celebration */}
      {completion.percentage === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                🎉 Congratulations!
              </h3>
              <p className="text-green-700">
                Your profile is 100% complete! You now have access to all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-2">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Complete phases in order to unlock the next one</li>
              <li>Phase 5 is optional and can be completed anytime</li>
              <li>You can edit any phase after completion</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-2">📞 Support:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Contact your manager for assistance</li>
              <li>Check the help documentation</li>
              <li>All information is saved automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const IncubateeProfile: React.FC = () => {
  return (
    <ProfileProvider>
      <ProfileContent />
    </ProfileProvider>
  );
};

export default IncubateeProfile;

