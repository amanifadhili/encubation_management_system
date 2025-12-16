import React, { useState, useEffect, useMemo } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SkillsSelectorProps {
  onSave?: (skills: string[]) => void;
  initialSkills?: string[];
}

const predefinedSkills = [
  { value: 'Coding/Development', label: 'Coding/Development', emoji: '💻', category: 'Technical' },
  { value: 'UX/UI Design', label: 'UX/UI Design', emoji: '🎨', category: 'Design' },
  { value: '3D Modeling/Prototyping', label: '3D Modeling/Prototyping', emoji: '🔧', category: 'Technical' },
  { value: 'Market Research', label: 'Market Research', emoji: '📊', category: 'Business' },
  { value: 'Business Strategy', label: 'Business Strategy', emoji: '📈', category: 'Business' },
  { value: 'Financial Modeling', label: 'Financial Modeling', emoji: '💰', category: 'Business' },
  { value: 'Marketing/PR', label: 'Marketing/PR', emoji: '📢', category: 'Business' },
];

const skillColors = {
  Technical: 'bg-blue-100 text-blue-800 border-blue-200',
  Design: 'bg-purple-100 text-purple-800 border-purple-200',
  Business: 'bg-green-100 text-green-800 border-green-200',
  Custom: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const SkillsSelector: React.FC<SkillsSelectorProps> = ({ onSave, initialSkills }) => {
  const { profile } = useProfile();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize selected skills from profile or initialSkills prop
  useEffect(() => {
    const skills = initialSkills || (profile?.skills && Array.isArray(profile.skills) 
      ? profile.skills.filter((s: string) => typeof s === 'string')
      : []);
    setSelectedSkills(skills);
  }, [profile, initialSkills]);

  // Filter skills based on search query
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) {
      return predefinedSkills;
    }
    const query = searchQuery.toLowerCase();
    return predefinedSkills.filter(
      (skill) =>
        skill.label.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSkillToggle = (skillValue: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillValue)) {
        return prev.filter((s) => s !== skillValue);
      } else {
        return [...prev, skillValue];
      }
    });

    // Clear error when user selects
    if (errors.skills) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.skills;
        return newErrors;
      });
    }
  };

  const handleRemoveSkill = (skillValue: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skillValue));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleCustomSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedSkills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
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

      // Pass selected skills to parent
      if (onSave) {
        onSave(selectedSkills);
      }
    } catch (error) {
      console.error('Failed to save skills:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSkillCategory = (skillValue: string): string => {
    const skill = predefinedSkills.find((s) => s.value === skillValue);
    return skill?.category || 'Custom';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Primary Skill Areas"
        name="skills"
        required
        error={errors.skills}
        touched={touched}
        helperText="Select all skills that apply to you (suggested: 3-5 primary skills)"
      >
        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {filteredSkills.map((skill) => {
            const isSelected = selectedSkills.includes(skill.value);
            return (
              <button
                key={skill.value}
                type="button"
                onClick={() => handleSkillToggle(skill.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{skill.emoji}</span>
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {skill.label}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-green-500 ml-auto"
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
              </button>
            );
          })}
        </div>

        {/* Custom Skill Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add custom skill (press Enter to add)"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyPress={handleCustomSkillKeyPress}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm"
            maxLength={50}
          />
          <button
            type="button"
            onClick={handleAddCustomSkill}
            disabled={!customSkill.trim()}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        {/* Selected Skills Tags */}
        {selectedSkills.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Skills ({selectedSkills.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => {
                const category = getSkillCategory(skill);
                const skillData = predefinedSkills.find((s) => s.value === skill);
                return (
                  <div
                    key={skill}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      skillColors[category as keyof typeof skillColors] ||
                      skillColors.Custom
                    }`}
                  >
                    {skillData && <span>{skillData.emoji}</span>}
                    <span className="text-sm font-medium">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSkills.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <p>No skills found matching "{searchQuery}"</p>
            <p className="text-sm mt-2">Try adding it as a custom skill above</p>
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
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};

export default SkillsSelector;

