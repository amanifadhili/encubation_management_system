import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Layout';
import { getEmailPreferences, updateEmailPreferences } from '../services/api';
import Button from '../components/Button';
import { ButtonLoader } from '../components/loading';

interface EmailPreferences {
  id: string;
  user_id: string;
  user_created: boolean;
  user_updated: boolean;
  team_updates: boolean;
  project_updates: boolean;
  notifications: boolean;
  messages: boolean;
  announcements: boolean;
  material_requests: boolean;
  inventory_updates: boolean;
}

const EmailPreferences = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [formData, setFormData] = useState<Partial<EmailPreferences>>({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await getEmailPreferences();
      setPreferences(data);
      setFormData(data);
    } catch (error: any) {
      console.error('Failed to load email preferences:', error);
      showToast(error.response?.data?.message || 'Failed to load email preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof EmailPreferences) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateEmailPreferences(formData);
      setPreferences(updated);
      showToast('Email preferences updated successfully', 'success');
    } catch (error: any) {
      console.error('Failed to update email preferences:', error);
      showToast(error.response?.data?.message || 'Failed to update email preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const preferenceLabels: Record<keyof Omit<EmailPreferences, 'id' | 'user_id'>, { label: string; description: string }> = {
    user_created: {
      label: 'User Account Created',
      description: 'Receive email when your account is created'
    },
    user_updated: {
      label: 'User Account Updated',
      description: 'Receive email when your account information is updated'
    },
    team_updates: {
      label: 'Team Updates',
      description: 'Receive emails about team-related events and changes'
    },
    project_updates: {
      label: 'Project Updates',
      description: 'Receive emails about project status changes and updates'
    },
    notifications: {
      label: 'Notifications',
      description: 'Receive email notifications for system notifications'
    },
    messages: {
      label: 'Messages',
      description: 'Receive email notifications when you receive new messages'
    },
    announcements: {
      label: 'Announcements',
      description: 'Receive email notifications for system announcements'
    },
    material_requests: {
      label: 'Material Requests',
      description: 'Receive emails about material request status changes'
    },
    inventory_updates: {
      label: 'Inventory Updates',
      description: 'Receive emails when inventory items are assigned to your team'
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Preferences</h1>
        <p className="text-gray-600">
          Manage your email notification preferences. Choose which types of emails you want to receive.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {Object.entries(preferenceLabels).map(([key, { label, description }]) => (
            <div key={key} className="flex items-start justify-between py-4 border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData[key as keyof EmailPreferences] ?? false}
                  onChange={() => handleToggle(key as keyof EmailPreferences)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={loadPreferences}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <ButtonLoader /> : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
