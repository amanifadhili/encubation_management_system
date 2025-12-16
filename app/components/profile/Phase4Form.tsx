import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import ProjectBasicsForm from './ProjectBasicsForm';
import ProjectDetailsForm from './ProjectDetailsForm';
import { RocketLaunchIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useToast } from '../Layout';
import { createProject, updateProject } from '../../services/api';

interface Phase4FormProps {
  onComplete?: () => void;
  existingProject?: any;
}

export const Phase4Form: React.FC<Phase4FormProps> = ({
  onComplete,
  existingProject,
}) => {
  const { completion, profile } = useProfile();
  const [activeSection, setActiveSection] = useState<'basics' | 'details'>('basics');
  const [formData, setFormData] = useState({
    startup_company_name: '',
    name: '',
    status_at_enrollment: '',
    description: '',
    challenge_description: '',
    category: '',
  });
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  const isPhase4Complete = completion?.phases.phase4 || false;

  // Initialize form data from existing project
  useEffect(() => {
    if (existingProject) {
      setFormData({
        startup_company_name: existingProject.startup_company_name || '',
        name: existingProject.name || '',
        status_at_enrollment: existingProject.status_at_enrollment || '',
        description: existingProject.description || '',
        challenge_description: existingProject.challenge_description || '',
        category: existingProject.category || '',
      });
    }
  }, [existingProject]);

  const handleBasicsSave = (data: {
    startup_company_name?: string;
    name: string;
    status_at_enrollment: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    setActiveSection('details');
  };

  const handleDetailsSave = async (data: {
    description: string;
    challenge_description: string;
    category: string;
  }) => {
    try {
      setSaving(true);

      const finalData = {
        ...formData,
        ...data,
      };

      // Validate required fields
      if (!finalData.name || !finalData.category) {
        showToast('Project name and category are required', 'error');
        return;
      }

      // If we have an existing project, update it
      if (existingProject) {
        const response = await updateProject(existingProject.id, {
          name: finalData.name,
          description: finalData.description,
          category: finalData.category,
          startup_company_name: finalData.startup_company_name || undefined,
          status_at_enrollment: finalData.status_at_enrollment || undefined,
          challenge_description: finalData.challenge_description || undefined,
        });

        if (response.success) {
          showToast('Project updated successfully', 'success');
          if (onComplete) {
            onComplete();
          }
        } else {
          // Handle validation errors
          const errorMessage = response.errors && response.errors.length > 0
            ? response.errors.map((e: any) => e.message || e).join(', ')
            : response.message || 'Failed to update project';
          showToast(errorMessage, 'error');
        }
      } else {
        // Create new project (backend will automatically get team_id from user's team membership)
        const response = await createProject({
          name: finalData.name,
          description: finalData.description,
          category: finalData.category,
          startup_company_name: finalData.startup_company_name || undefined,
          status_at_enrollment: finalData.status_at_enrollment || undefined,
          challenge_description: finalData.challenge_description || undefined,
          status: 'pending', // Default status
        });

        if (response.success) {
          showToast('Project created successfully', 'success');
          if (onComplete) {
            onComplete();
          }
        } else {
          // Handle specific error cases
          if (response.code === 'INSUFFICIENT_PERMISSIONS' || response.message?.includes('team leader')) {
            showToast('Only team leaders can create projects. Please contact your manager to be assigned as a team leader.', 'error');
          } else if (response.code === 'MISSING_REQUIRED_FIELDS') {
            const errorMessage = response.errors && response.errors.length > 0
              ? response.errors.map((e: any) => e.message || e).join(', ')
              : response.message || 'Missing required fields';
            showToast(errorMessage, 'error');
          } else {
            // Handle validation errors
            const errorMessage = response.errors && response.errors.length > 0
              ? response.errors.map((e: any) => e.message || e).join(', ')
              : response.message || 'Failed to create project';
            showToast(errorMessage, 'error');
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to save project:', error);
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.errors?.map((e: any) => e.message || e).join(', ')
        || error?.message 
        || 'Failed to save project. Please try again.';
      
      // Check for specific error codes
      if (error?.response?.data?.code === 'INSUFFICIENT_PERMISSIONS' || 
          errorMessage.toLowerCase().includes('team leader')) {
        showToast('Only team leaders can create projects. Please contact your manager to be assigned as a team leader.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSectionStatus = (section: 'basics' | 'details') => {
    switch (section) {
      case 'basics':
        return !!(formData.name && formData.status_at_enrollment);
      case 'details':
        return !!(
          formData.description &&
          formData.challenge_description &&
          formData.category
        );
      default:
        return false;
    }
  };

  const canNavigateTo = (section: 'basics' | 'details') => {
    switch (section) {
      case 'basics':
        return true;
      case 'details':
        return getSectionStatus('basics');
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSection('basics')}
          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'basics'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : getSectionStatus('basics')
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <RocketLaunchIcon className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Project Basics</span>
            {getSectionStatus('basics') && (
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
            if (canNavigateTo('details')) {
              setActiveSection('details');
            }
          }}
          disabled={!canNavigateTo('details')}
          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
            activeSection === 'details'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : getSectionStatus('details')
              ? 'border-green-200 bg-green-50 text-green-700'
              : canNavigateTo('details')
              ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Project Details</span>
            {getSectionStatus('details') && (
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
        {activeSection === 'basics' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Project Basics
              </h3>
              <p className="text-sm text-gray-600">
                Provide basic information about your project.
              </p>
            </div>
            <ProjectBasicsForm
              initialData={{
                startup_company_name: formData.startup_company_name,
                name: formData.name,
                status_at_enrollment: formData.status_at_enrollment,
              }}
              onSave={handleBasicsSave}
              onNext={() => setActiveSection('details')}
            />
          </div>
        )}

        {activeSection === 'details' && (
          <div>
            {!getSectionStatus('basics') && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please complete the Project Basics section first.
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Project Details
              </h3>
              <p className="text-sm text-gray-600">
                Describe your project in detail and specify the problem you're solving.
              </p>
            </div>
            <ProjectDetailsForm
              initialData={{
                description: formData.description,
                challenge_description: formData.challenge_description,
                category: formData.category,
              }}
              onSave={handleDetailsSave}
              onSubmit={onComplete}
            />
          </div>
        )}
      </div>

      {/* Completion Status */}
      {isPhase4Complete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">🚀 Project Information Complete!</p>
              <p className="text-sm text-green-700">
                Your project information has been saved. Phase 4 is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note about Team Leader Requirement */}
      {!existingProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-blue-900">Team Leader Required</p>
              <p className="text-sm text-blue-700">
                Only team leaders can create projects. If you're not a team leader, please contact your manager to be assigned as one. The system will automatically link your project to your team.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase4Form;

