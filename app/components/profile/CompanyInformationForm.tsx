import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../FormField';
import { ButtonLoader } from '../loading';
import { getIncubator, updateIncubator } from '../../services/api';
import { useToast } from '../Layout';
import { BuildingOfficeIcon, CalendarIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

interface CompanyInformationFormProps {
  teamId?: string;
  onSave?: () => void;
}

export const CompanyInformationForm: React.FC<CompanyInformationFormProps> = ({ teamId, onSave }) => {
  const { user } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [formData, setFormData] = useState({
    enrollment_date: '',
    rdb_registration_status: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if current user is team leader
  const isTeamLeader = user?.role === 'incubator' && (user as any).teamId === teamId;

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const response = await getIncubator(teamId);
      const team = response?.data?.team || response?.data || response;
      setTeamData(team);
      
      // Format enrollment_date for input (YYYY-MM-DD)
      const enrollmentDate = team.enrollment_date 
        ? new Date(team.enrollment_date).toISOString().split('T')[0]
        : '';
      
      setFormData({
        enrollment_date: enrollmentDate,
        rdb_registration_status: team.rdb_registration_status || '',
      });
    } catch (error: any) {
      console.error('Failed to load team data:', error);
      showToast('Failed to load company information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.enrollment_date) {
      const date = new Date(formData.enrollment_date);
      if (isNaN(date.getTime())) {
        newErrors.enrollment_date = 'Please enter a valid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTeamLeader) {
      showToast('Only team leaders can update company information', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData: any = {};
      if (formData.enrollment_date) {
        updateData.enrollment_date = new Date(formData.enrollment_date).toISOString();
      } else {
        updateData.enrollment_date = null;
      }
      if (formData.rdb_registration_status) {
        updateData.rdb_registration_status = formData.rdb_registration_status;
      } else {
        updateData.rdb_registration_status = null;
      }

      await updateIncubator(teamId!, {
        enrollment_date: updateData.enrollment_date,
        rdb_registration_status: updateData.rdb_registration_status,
      });

      showToast('Company information updated successfully', 'success');
      if (onSave) {
        onSave();
      }
      await loadTeamData();
    } catch (error: any) {
      console.error('Failed to update company information:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update company information';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">No company information available. You are not part of a team.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
        </div>
        <p className="text-sm text-gray-600">
          {isTeamLeader 
            ? 'Update your company enrollment and registration information.'
            : 'View company enrollment and registration information (read-only).'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enrollment Date */}
        <FormField
          label="Enrollment Date"
          name="enrollment_date"
          error={errors.enrollment_date}
          helperText="The date your company/team enrolled in this hub"
        >
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              id="enrollment_date"
              name="enrollment_date"
              value={formData.enrollment_date}
              onChange={handleChange}
              disabled={!isTeamLeader}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 ${
                isTeamLeader 
                  ? 'bg-white shadow-sm hover:shadow-md' 
                  : 'bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>
        </FormField>

        {/* RDB Registration Status */}
        <FormField
          label="RDB Registration Status"
          name="rdb_registration_status"
          error={errors.rdb_registration_status}
          helperText="Your company's registration status with RDB (Rwanda Development Board)"
        >
          <div className="relative">
            <DocumentCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              id="rdb_registration_status"
              name="rdb_registration_status"
              value={formData.rdb_registration_status}
              onChange={handleChange}
              disabled={!isTeamLeader}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 ${
                isTeamLeader 
                  ? 'bg-white shadow-sm hover:shadow-md' 
                  : 'bg-gray-50 cursor-not-allowed'
              }`}
            >
              <option value="">Select status</option>
              <option value="Registered">Registered</option>
              <option value="Pending Registration">Pending Registration</option>
              <option value="Not Registered">Not Registered</option>
              <option value="In Process">In Process</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </FormField>

        {/* Display current values if read-only */}
        {!isTeamLeader && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {formData.enrollment_date && (
              <div>
                <span className="text-sm font-semibold text-gray-700">Enrollment Date: </span>
                <span className="text-sm text-gray-900">
                  {new Date(formData.enrollment_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            {formData.rdb_registration_status && (
              <div>
                <span className="text-sm font-semibold text-gray-700">RDB Registration Status: </span>
                <span className="text-sm text-gray-900">{formData.rdb_registration_status}</span>
              </div>
            )}
            {!formData.enrollment_date && !formData.rdb_registration_status && (
              <p className="text-sm text-gray-500 italic">No company information has been entered yet.</p>
            )}
          </div>
        )}

        {/* Save Button (only for team leaders) */}
        {isTeamLeader && (
          <div className="pt-4 border-t border-gray-200">
            <ButtonLoader
              type="submit"
              variant="primary"
              loading={saving}
              label="Save Company Information"
              loadingText="Saving..."
            />
          </div>
        )}
      </form>
    </div>
  );
};

