import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PhaseCardProps {
  phaseNumber: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  completed: boolean;
  locked: boolean;
  children: React.ReactNode;
  onContinue?: () => void;
  estimatedTime?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phaseNumber,
  title,
  description,
  icon,
  completed,
  locked,
  children,
  onContinue,
  estimatedTime,
  collapsible = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!locked && defaultExpanded);

  const toggleExpanded = () => {
    if (!locked && collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${
        locked
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : completed
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 ${collapsible && !locked ? 'cursor-pointer' : ''}`}
        onClick={toggleExpanded}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Phase Number Badge */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                locked
                  ? 'bg-gray-300 text-gray-500'
                  : completed
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {completed ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                phaseNumber
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-2xl">{icon}</span>}
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {completed && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Complete
                  </span>
                )}
                {locked && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                    <LockClosedIcon className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              {estimatedTime && (
                <p className="text-xs text-gray-500">
                  ⏱️ Estimated time: {estimatedTime}
                </p>
              )}
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          {collapsible && !locked && (
            <div className="flex-shrink-0 ml-4">
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Locked Message */}
      {locked && (
        <div className="px-5 pb-5">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Complete previous phases to unlock this section.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {!locked && isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-200 pt-5">
          {children}
          {onContinue && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContinue();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {completed ? 'Update' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseCard;

