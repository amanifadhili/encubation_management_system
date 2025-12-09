import React from 'react';

interface PhaseCompletion {
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  phase5: boolean;
}

interface CompletionProgressBarProps {
  percentage: number;
  phases?: PhaseCompletion;
  showPhaseBreakdown?: boolean;
}

export const CompletionProgressBar: React.FC<CompletionProgressBarProps> = ({
  percentage,
  phases,
  showPhaseBreakdown = true,
}) => {
  const getColorClass = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (percentage: number) => {
    if (percentage === 100) return 'text-green-700';
    if (percentage >= 75) return 'text-blue-700';
    if (percentage >= 50) return 'text-yellow-700';
    if (percentage >= 25) return 'text-orange-700';
    return 'text-red-700';
  };

  // Phase 4 (Project Information) has been moved to Projects page
  const phaseLabels = [
    { key: 'phase1', label: 'Essential Info', number: 1 },
    { key: 'phase2', label: 'Academic', number: 2 },
    { key: 'phase3', label: 'Professional', number: 3 },
    { key: 'phase5', label: 'Additional', number: 5 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete your profile to unlock all features
          </p>
        </div>
        <div className={`text-2xl font-bold ${getTextColorClass(percentage)}`}>
          {percentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
        <div
          className={`h-full ${getColorClass(percentage)} transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-2`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          {percentage > 10 && (
            <span className="text-xs font-medium text-white">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Phase Breakdown */}
      {showPhaseBreakdown && phases && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {phaseLabels.map((phase) => {
            const isComplete = phases[phase.key as keyof PhaseCompletion];
            return (
              <div
                key={phase.key}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  isComplete
                    ? 'bg-green-50 border-green-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isComplete ? '✓' : phase.number}
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    isComplete ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Message */}
      {percentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium text-center">
            🎉 Congratulations! Your profile is complete!
          </p>
        </div>
      )}
    </div>
  );
};

export default CompletionProgressBar;

