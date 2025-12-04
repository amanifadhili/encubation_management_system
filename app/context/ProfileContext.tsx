import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getExtendedProfile,
  getProfileCompletion,
  updateProfilePhase1,
  updateProfilePhase2,
  updateProfilePhase3,
  updateProfilePhase5,
  uploadProfilePhoto,
} from '../services/api';
import { useToast } from '../components/Layout';

interface PhaseCompletion {
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  phase4: boolean;
  phase5: boolean;
}

interface ProfileCompletion {
  percentage: number;
  phases: PhaseCompletion;
  missingFields: string[];
}

interface ExtendedProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  profile_photo_url?: string;
  enrollment_status?: string;
  major_program?: string;
  program_of_study?: string;
  graduation_year?: number;
  current_role?: string;
  skills?: string[] | any;
  support_interests?: string[] | any;
  additional_notes?: string;
  profile_completion_percentage: number;
  profile_phase_completion?: any;
}

interface ProfileContextType {
  profile: ExtendedProfile | null;
  completion: ProfileCompletion | null;
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
  refreshProfile: () => Promise<void>;
  refreshCompletion: () => Promise<void>;
  updatePhase1: (data: any) => Promise<boolean>;
  updatePhase2: (data: any) => Promise<boolean>;
  updatePhase3: (data: any) => Promise<boolean>;
  updatePhase5: (data: any) => Promise<boolean>;
  uploadPhoto: (url: string) => Promise<boolean>;
  saveToLocalStorage: (phase: string, data: any) => void;
  getFromLocalStorage: (phase: string) => any;
  clearLocalStorage: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const showToast = useToast();

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const response = await getExtendedProfile();
      if (response.success && response.data) {
        // Parse JSON fields if they're strings
        const data = { ...response.data };
        if (typeof data.skills === 'string' && data.skills) {
          try {
            data.skills = JSON.parse(data.skills);
          } catch {
            data.skills = [];
          }
        }
        if (typeof data.support_interests === 'string' && data.support_interests) {
          try {
            data.support_interests = JSON.parse(data.support_interests);
          } catch {
            data.support_interests = [];
          }
        }
        setProfile(data as ExtendedProfile);
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshCompletion = async () => {
    try {
      const response = await getProfileCompletion();
      if (response.success && response.data) {
        setCompletion(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load completion:', error);
    }
  };

  const updatePhase1 = async (data: any): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await updateProfilePhase1(data);
      if (response.success) {
        await refreshProfile();
        await refreshCompletion();
        setLastSaved(new Date());
        clearLocalStorage(); // Clear draft after successful save
        showToast('Profile Phase 1 updated successfully', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      // Save to localStorage as backup
      saveToLocalStorage('phase1', data);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePhase2 = async (data: any): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await updateProfilePhase2(data);
      if (response.success) {
        await refreshProfile();
        await refreshCompletion();
        setLastSaved(new Date());
        clearLocalStorage();
        showToast('Profile Phase 2 updated successfully', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      saveToLocalStorage('phase2', data);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePhase3 = async (data: any): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await updateProfilePhase3(data);
      if (response.success) {
        await refreshProfile();
        await refreshCompletion();
        setLastSaved(new Date());
        clearLocalStorage();
        showToast('Profile Phase 3 updated successfully', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      saveToLocalStorage('phase3', data);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePhase5 = async (data: any): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await updateProfilePhase5(data);
      if (response.success) {
        await refreshProfile();
        await refreshCompletion();
        setLastSaved(new Date());
        clearLocalStorage();
        showToast('Profile Phase 5 updated successfully', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      saveToLocalStorage('phase5', data);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (url: string): Promise<boolean> => {
    try {
      const response = await uploadProfilePhoto(url);
      if (response.success) {
        await refreshProfile();
        showToast('Profile photo updated successfully', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to upload photo', 'error');
      return false;
    }
  };

  // LocalStorage backup functions
  const saveToLocalStorage = (phase: string, data: any) => {
    try {
      const key = `profile_draft_${phase}`;
      const timestamp = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify({ data, timestamp }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const getFromLocalStorage = (phase: string) => {
    try {
      const key = `profile_draft_${phase}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  };

  const clearLocalStorage = () => {
    try {
      const phases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'];
      phases.forEach((phase) => {
        localStorage.removeItem(`profile_draft_${phase}`);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  useEffect(() => {
    refreshProfile();
    refreshCompletion();
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        completion,
        loading,
        saving,
        lastSaved,
        refreshProfile,
        refreshCompletion,
        updatePhase1,
        updatePhase2,
        updatePhase3,
        updatePhase5,
        uploadPhoto,
        saveToLocalStorage,
        getFromLocalStorage,
        clearLocalStorage,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

