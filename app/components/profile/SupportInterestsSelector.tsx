import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

interface SupportInterestsSelectorProps {
  onSave?: (interests: string[], otherInterest?: string) => void;
  initialInterests?: string[];
}

const supportInterests = [
  {
    value: 'Mentorship',
    label: 'Mentorship/Advisory Services',
    description: 'Get guidance from experienced mentors',
    icon: UserGroupIcon,
    emoji: '👨‍🏫',
    color: 'blue',
  },
  {
    value: 'Funding',
    label: 'Funding Opportunities',
    description: 'Access to investors and funding resources',
    icon: CurrencyDollarIcon,
    emoji: '💵',
    color: 'green',
  },
  {
    value: 'Networking',
    label: 'Networking Events',
    description: 'Connect with industry professionals',
    icon: UserPlusIcon,
    emoji: '🤝',
    color: 'purple',
  },
  {
    value: 'TechnicalEquipment',
    label: 'Technical Equipment/Lab Access',
    description: 'Use labs and technical equipment',
    icon: BeakerIcon,
    emoji: '🔬',
    color: 'yellow',
  },
  {
    value: 'BusinessTraining',
    label: 'Business Training/Workshops',
    description: 'Participate in training programs',
    icon: BookOpenIcon,
    emoji: '📚',
    color: 'indigo',
  },
  {
    value: 'CoworkingSpace',
    label: 'Co-working Space Access',
    description: 'Access to workspace facilities',
    icon: BuildingOfficeIcon,
    emoji: '🏢',
    color: 'pink',
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Other support interests',
    icon: PlusCircleIcon,
    emoji: '➕',
    color: 'gray',
  },
];

const colorClasses = {
  blue: {
    selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
    unselected: 'border-gray-200 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-600',
  },
  green: {
    selected: 'border-green-500 bg-green-50 ring-2 ring-green-500',
    unselected: 'border-gray-200 hover:border-green-300',
    icon: 'bg-green-100 text-green-600',
  },
  purple: {
    selected: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
    unselected: 'border-gray-200 hover:border-purple-300',
    icon: 'bg-purple-100 text-purple-600',
  },
  yellow: {
    selected: 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500',
    unselected: 'border-gray-200 hover:border-yellow-300',
    icon: 'bg-yellow-100 text-yellow-600',
  },
  indigo: {
    selected: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500',
    unselected: 'border-gray-200 hover:border-indigo-300',
    icon: 'bg-indigo-100 text-indigo-600',
  },
  pink: {
    selected: 'border-pink-500 bg-pink-50 ring-2 ring-pink-500',
    unselected: 'border-gray-200 hover:border-pink-300',
    icon: 'bg-pink-100 text-pink-600',
  },
  gray: {
    selected: 'border-gray-500 bg-gray-50 ring-2 ring-gray-500',
    unselected: 'border-gray-200 hover:border-gray-300',
    icon: 'bg-gray-100 text-gray-600',
  },
};

export const SupportInterestsSelector: React.FC<SupportInterestsSelectorProps> = ({
  onSave,
  initialInterests,
}) => {
  const { profile } = useProfile();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize selected interests from profile or initialInterests prop
  useEffect(() => {
    const interests = initialInterests || (profile?.support_interests && Array.isArray(profile.support_interests)
      ? profile.support_interests.filter((i: string) => typeof i === 'string')
      : []);
    setSelectedInterests(interests);
  }, [profile, initialInterests]);

  const handleInterestToggle = (interestValue: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestValue)) {
        return prev.filter((i) => i !== interestValue);
      } else {
        return [...prev, interestValue];
      }
    });

    // Clear error when user selects
    if (errors.support_interests) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.support_interests;
        return newErrors;
      });
    }
  };

  const handleOtherInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherInterest(e.target.value);
    if (errors.other_interest) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.other_interest;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedInterests.length === 0) {
      newErrors.support_interests = 'Please select at least one support interest';
    } else if (selectedInterests.includes('Other') && !otherInterest.trim()) {
      newErrors.other_interest = 'Please specify your other interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      setTouched(true);
      return;
    }

    try {
      setSaving(true);

      // Pass selected interests to parent
      if (onSave) {
        onSave(selectedInterests, otherInterest);
      }
    } catch (error) {
      console.error('Failed to save support interests:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Resources/Support Interested In"
        name="support_interests"
        required
        error={errors.support_interests}
        touched={touched}
        helperText="Select all resources you're interested in"
      >
        {/* Support Interests Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {supportInterests.map((interest) => {
            const Icon = interest.icon;
            const isSelected = selectedInterests.includes(interest.value);
            const colors = colorClasses[interest.color as keyof typeof colorClasses];

            return (
              <button
                key={interest.value}
                type="button"
                onClick={() => handleInterestToggle(interest.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected ? colors.selected : colors.unselected
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                    <span className="text-2xl">{interest.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold text-sm ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {interest.label}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{interest.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Other Interest Input */}
        {selectedInterests.includes('Other') && (
          <div className="mt-4">
            <FormField
              label="Please Specify Your Interest"
              name="other_interest"
              required
              error={errors.other_interest}
              touched={touched}
            >
              <input
                type="text"
                id="other_interest"
                name="other_interest"
                value={otherInterest}
                onChange={handleOtherInterestChange}
                onBlur={() => setTouched(true)}
                placeholder="Describe your support interest"
                className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                  errors.other_interest && touched
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
                maxLength={100}
              />
            </FormField>
          </div>
        )}

        {/* Selected Interests Summary */}
        {selectedInterests.length > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Interests ({selectedInterests.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedInterests
                .filter((i) => i !== 'Other')
                .map((interest) => {
                  const interestData = supportInterests.find((s) => s.value === interest);
                  return (
                    <div
                      key={interest}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200"
                    >
                      <span>{interestData?.emoji}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {interestData?.label}
                      </span>
                    </div>
                  );
                })}
              {selectedInterests.includes('Other') && otherInterest && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
                  <span>➕</span>
                  <span className="text-sm font-medium text-gray-700">{otherInterest}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </FormField>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default SupportInterestsSelector;

