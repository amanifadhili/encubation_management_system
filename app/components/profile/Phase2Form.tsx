import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import EnrollmentStatusForm from './EnrollmentStatusForm';
import AcademicDetailsForm from './AcademicDetailsForm';
import { AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface Phase2FormProps {
  onComplete?: () => void;
}

export const Phase2Form: React.FC<Phase2FormProps> = ({ onComplete }) => {
  const { completion, profile } = useProfile();
  const [activeSection, setActiveSection] = useState<'status' | 'details'>('status');
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('');

  const isPhase2Complete = completion?.phases.phase2 || false;

  // Initialize enrollment status from profile
  useEffect(() => {
    if (profile?.enrollment_status) {
      setEnrollmentStatus(profile.enrollment_status);
      // If enrollment status exists, go to details section
      setActiveSection('details');
    }
  }, [profile]);

  const handleStatusComplete = (status: string) => {
    setEnrollmentStatus(status);
    // Small delay to allow state update before switching sections
    setTimeout(() => {
      setActiveSection('details');
    }, 100);
  };

  const handleDetailsComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('status')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'status'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : enrollmentStatus
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AcademicCapIcon className="w-5 h-5" />
            <span className="font-medium">Enrollment Status</span>
            {enrollmentStatus && (
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
            if (enrollmentStatus) {
              setActiveSection('details');
            }
          }}
          disabled={!enrollmentStatus}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'details'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : enrollmentStatus
              ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpenIcon className="w-5 h-5" />
            <span className="font-medium">Academic Details</span>
            {profile?.major_program && profile?.program_of_study && profile?.graduation_year && (
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
        {activeSection === 'status' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enrollment Status
              </h3>
              <p className="text-sm text-gray-600">
                Tell us about your current academic enrollment status.
              </p>
            </div>
            <EnrollmentStatusForm
              onSave={(status) => {
                setEnrollmentStatus(status);
                // Update profile context with enrollment status
                // The full save will happen in AcademicDetailsForm
                handleStatusComplete(status);
              }}
            />
          </div>
        )}

        {activeSection === 'details' && (
          <div>
            {!enrollmentStatus && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please complete the Enrollment Status section first.
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Academic Details
              </h3>
              <p className="text-sm text-gray-600">
                Provide details about your academic program and graduation timeline.
              </p>
            </div>
            <AcademicDetailsForm
              enrollmentStatus={enrollmentStatus || profile?.enrollment_status || ''}
              onSave={handleDetailsComplete}
            />
          </div>
        )}
      </div>

      {/* Completion Status */}
      {isPhase2Complete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">🎓 Academic Profile Complete!</p>
              <p className="text-sm text-green-700">
                Your academic profile has been saved. You can now proceed to Phase 3.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2Form;

