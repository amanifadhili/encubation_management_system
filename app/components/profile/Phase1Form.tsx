import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import PersonalIdentityForm from './PersonalIdentityForm';
import ContactInformationForm from './ContactInformationForm';
import { UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface Phase1FormProps {
  onComplete?: () => void;
}

export const Phase1Form: React.FC<Phase1FormProps> = ({ onComplete }) => {
  const { completion } = useProfile();
  const [activeSection, setActiveSection] = useState<'identity' | 'contact'>('identity');

  const isPhase1Complete = completion?.phases.phase1 || false;

  const handleSectionComplete = () => {
    // Switch to contact section after identity is saved
    if (activeSection === 'identity') {
      setActiveSection('contact');
    } else if (activeSection === 'contact' && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('identity')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'identity'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UserIcon className="w-5 h-5" />
            <span className="font-medium">Personal Identity</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSection('contact')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'contact'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PhoneIcon className="w-5 h-5" />
            <span className="font-medium">Contact Information</span>
          </div>
        </button>
      </div>

      {/* Form Sections */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeSection === 'identity' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personal Identity
              </h3>
              <p className="text-sm text-gray-600">
                Tell us about yourself. This information will be used throughout the system.
              </p>
            </div>
            <PersonalIdentityForm onSave={handleSectionComplete} />
          </div>
        )}

        {activeSection === 'contact' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Contact Information
              </h3>
              <p className="text-sm text-gray-600">
                Provide your contact details so we can reach you when needed.
              </p>
            </div>
            <ContactInformationForm onSave={handleSectionComplete} />
          </div>
        )}
      </div>

      {/* Completion Status */}
      {isPhase1Complete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">Phase 1 Complete! ✅</p>
              <p className="text-sm text-green-700">
                Your essential information has been saved. You can now proceed to Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase1Form;

