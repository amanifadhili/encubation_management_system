import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import ProfessionalRoleForm from './ProfessionalRoleForm';
import SkillsSelector from './SkillsSelector';
import SupportInterestsSelector from './SupportInterestsSelector';
import { BriefcaseIcon, AcademicCapIcon, HeartIcon } from '@heroicons/react/24/outline';

interface Phase3FormProps {
  onComplete?: () => void;
}

export const Phase3Form: React.FC<Phase3FormProps> = ({ onComplete }) => {
  const { completion, profile, updatePhase3 } = useProfile();
  const [activeSection, setActiveSection] = useState<'role' | 'skills' | 'interests'>('role');
  const [formData, setFormData] = useState({
    current_role: '',
    other_role: '',
    skills: [] as string[],
    support_interests: [] as string[],
    other_interest: '',
  });

  const isPhase3Complete = completion?.phases.phase3 || false;

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        current_role: profile.current_role || '',
        other_role: '',
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        support_interests: Array.isArray(profile.support_interests)
          ? profile.support_interests
          : [],
        other_interest: '',
      });

      // Determine which section to show based on completion
      if (profile.current_role) {
        if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
          setActiveSection('interests');
        } else {
          setActiveSection('skills');
        }
      }
    }
  }, [profile]);

  const handleRoleComplete = (role: string, otherRole?: string) => {
    const finalRole = role === 'Other' ? otherRole : role;
    setFormData((prev) => ({
      ...prev,
      current_role: role,
      other_role: otherRole || '',
    }));
    setTimeout(() => {
      setActiveSection('skills');
    }, 100);
  };

  const handleSkillsComplete = (skills: string[]) => {
    setFormData((prev) => ({
      ...prev,
      skills,
    }));
    setTimeout(() => {
      setActiveSection('interests');
    }, 100);
  };

  const handleInterestsComplete = async (interests: string[], otherInterest?: string) => {
    try {
      const finalRole = formData.current_role === 'Other' 
        ? formData.other_role 
        : formData.current_role;

      const finalInterests = interests.includes('Other') && otherInterest
        ? [...interests.filter(i => i !== 'Other'), otherInterest]
        : interests;

      const updateData = {
        current_role: finalRole || formData.current_role,
        skills: formData.skills,
        support_interests: finalInterests,
      };

      const success = await updatePhase3(updateData);
      if (success && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to save Phase 3 data:', error);
    }
  };

  const getSectionStatus = (section: 'role' | 'skills' | 'interests') => {
    switch (section) {
      case 'role':
        return !!formData.current_role;
      case 'skills':
        return formData.skills.length > 0;
      case 'interests':
        return formData.support_interests.length > 0;
      default:
        return false;
    }
  };

  const canNavigateTo = (section: 'role' | 'skills' | 'interests') => {
    switch (section) {
      case 'role':
        return true;
      case 'skills':
        return getSectionStatus('role');
      case 'interests':
        return getSectionStatus('role') && getSectionStatus('skills');
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSection('role')}
          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'role'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : getSectionStatus('role')
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BriefcaseIcon className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Role</span>
            {getSectionStatus('role') && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
        <button
          onClick={() => {
            if (canNavigateTo('skills')) {
              setActiveSection('skills');
            }
          }}
          disabled={!canNavigateTo('skills')}
          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'skills'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : getSectionStatus('skills')
              ? 'border-green-200 bg-green-50 text-green-700'
              : canNavigateTo('skills')
              ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AcademicCapIcon className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Skills</span>
            {getSectionStatus('skills') && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
        <button
          onClick={() => {
            if (canNavigateTo('interests')) {
              setActiveSection('interests');
            }
          }}
          disabled={!canNavigateTo('interests')}
          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'interests'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : getSectionStatus('interests')
              ? 'border-green-200 bg-green-50 text-green-700'
              : canNavigateTo('interests')
              ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <HeartIcon className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Interests</span>
            {getSectionStatus('interests') && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Form Sections */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeSection === 'role' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Professional Role
              </h3>
              <p className="text-sm text-gray-600">
                Tell us about your current role in the project or company.
              </p>
            </div>
            <ProfessionalRoleForm
              initialRole={formData.current_role}
              onSave={handleRoleComplete}
            />
          </div>
        )}

        {activeSection === 'skills' && (
          <div>
            {!getSectionStatus('role') && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please complete the Professional Role section first.
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Skills & Expertise
              </h3>
              <p className="text-sm text-gray-600">
                Select your primary skill areas. This helps us match you with relevant opportunities.
              </p>
            </div>
            <SkillsSelector
              initialSkills={formData.skills}
              onSave={handleSkillsComplete}
            />
          </div>
        )}

        {activeSection === 'interests' && (
          <div>
            {(!getSectionStatus('role') || !getSectionStatus('skills')) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please complete the Professional Role and Skills sections first.
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Support Interests
              </h3>
              <p className="text-sm text-gray-600">
                Select the resources and support you're interested in receiving.
              </p>
            </div>
            <SupportInterestsSelector
              initialInterests={formData.support_interests}
              onSave={handleInterestsComplete}
            />
          </div>
        )}
      </div>

      {/* Completion Status */}
      {isPhase3Complete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">💼 Professional Profile Complete!</p>
              <p className="text-sm text-green-700">
                Your professional profile has been saved. You can now proceed to Phase 4.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase3Form;

