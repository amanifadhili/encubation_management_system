/**
 * REFACTORED MentorManagement Component with New Loading System
 * 
 * This file shows how to integrate the new loading components into your existing page.
 * Compare this with the original MentorManagement.tsx to see the improvements.
 * 
 * Key Changes:
 * 1. Replaced "Loading teams..." text with PageSkeleton
 * 2. Replaced standard buttons with ButtonLoader components
 * 3. Added proper loading states for all actions
 * 4. Improved UX with professional loading indicators
 */

import React, { useState, useEffect } from "react";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { ValidationErrors } from "../components/ValidationErrors";
import type { ValidationError } from "../components/ValidationErrors";
import { FormField } from "../components/FormField";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Table from "../components/Table";
import type { TableColumn } from "../components/Table";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import RoleGuard from "../components/RoleGuard";
import Tooltip from "../components/Tooltip";
import Badge from "../components/Badge";

// ✅ NEW: Import loading components
import { ButtonLoader, PageSkeleton, useGlobalLoader } from "../components/loading";

import {
  getMentors,
  createMentor,
  updateMentor,
  deleteMentor,
  assignMentorToTeam,
  removeMentorFromTeam,
  getIncubators
} from "../services/api";

const defaultForm = {
  id: "",
  name: "",
  expertise: "",
  email: "",
  phone: "",
};

const PAGE_SIZE = 5;

const MentorManagement = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [isEdit, setIsEdit] = useState(false);
  const [assignMentorId, setAssignMentorId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const showToast = useToast();
  
  // ✅ NEW: Add loading states for individual actions
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // ✅ NEW: Use global loader for page transitions
  const { showLoader, hideLoader } = useGlobalLoader();

  // Validation error state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMentors();
      loadTeams();
    }
  }, [user]);

  const loadMentors = async () => {
    try {
      const data = await withRetry(
        () => getMentors(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            showToast(`Retrying... (${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setMentors(data);
    } catch (error: any) {
      console.error('Failed to load mentors:', error);
      const errorDetails = ErrorHandler.parse(error);
      
      if (ErrorHandler.isTimeout(error)) {
        showToast('Request timed out. Please try again.', 'error');
      } else {
        showToast(errorDetails.userMessage || 'Failed to load mentors', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await withRetry(() => getIncubators(), { maxRetries: 2 });
      setTeams(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading teams');
    }
  };

  const canModify = Boolean(user && user.role === "manager");

  const filtered = mentors.filter(
    (mentor) =>
      mentor.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.expertise?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.user?.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAddModal = () => {
    setForm({ ...defaultForm });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (mentor: any) => {
    setForm({
      id: mentor.id,
      name: mentor.user?.name || '',
      expertise: mentor.expertise || '',
      email: mentor.user?.email || '',
      phone: mentor.phone || ''
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const openAssignModal = (mentor: any) => {
    setAssignMentorId(mentor.id);
    const currentTeam = mentor.mentor_assignments?.[0]?.team_id || null;
    setSelectedTeam(currentTeam);
    setShowAssignModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ IMPROVED: Added proper loading state management
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.expertise || !form.email) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setValidationErrors([]);
    setSubmitting(true); // ✅ NEW: Set loading state
    
    try {
      if (isEdit) {
        await updateMentor(form.id, {
          name: form.name,
          expertise: form.expertise,
          email: form.email,
          phone: form.phone
        });
        setMentors(prev => prev.map(m => m.id === form.id ? {
          ...m,
          user: { ...m.user, name: form.name, email: form.email },
          expertise: form.expertise,
          phone: form.phone
        } : m));
        showToast("Mentor updated successfully!", "success");
      } else {
        const result = await createMentor({
          name: form.name,
          expertise: form.expertise,
          email: form.email,
          phone: form.phone
        });
        if (result.success && result.data?.mentor) {
          setMentors(prev => [...prev, result.data.mentor]);
        }
        showToast("Mentor added successfully!", "success");
      }
      setShowModal(false);
      setValidationErrors([]);
      setTouchedFields(new Set());
    } catch (error: any) {
      console.error('Failed to save mentor:', error);
      const errorDetails = error.errorDetails;
      
      if (ErrorHandler.isUnprocessableEntity(error)) {
        const businessError = ErrorHandler.parseBusinessLogicError(errorDetails);
        showToast(businessError.message, 'warning');
        
        if (businessError.field) {
          setFocusedField(businessError.field);
          setTouchedFields(prev => {
            const newSet = new Set(prev);
            if (businessError.field) newSet.add(businessError.field);
            return newSet;
          });
        }
      } else if (errorDetails?.status === 400) {
        const errors = ErrorHandler.parseValidationErrors(errorDetails);
        setValidationErrors(errors);
        
        if (errors.length > 0) {
          setFocusedField(errors[0].field);
        }
        
        showToast(errorDetails.userMessage, 'error');
      } else {
        showToast(errorDetails?.userMessage || 'Failed to save mentor', 'error');
      }
    } finally {
      setSubmitting(false); // ✅ NEW: Clear loading state
    }
  };

  const handleFieldFocus = (field: string) => {
    setFocusedField(field);
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  // ✅ IMPROVED: Added proper loading state management
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this mentor?")) {
      setDeleting(true); // ✅ NEW: Set loading state
      try {
        await deleteMentor(id);
        setMentors((prev) => prev.filter((m) => m.id !== id));
        showToast("Mentor deleted successfully!", "success");
      } catch (error: any) {
        console.error('Failed to delete mentor:', error);
        ErrorHandler.handleError(error, showToast, 'deleting mentor');
      } finally {
        setDeleting(false); // ✅ NEW: Clear loading state
      }
    }
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(prev => prev === teamId ? null : teamId);
  };

  // ✅ IMPROVED: Added proper loading state management
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMentorId) return;

    setAssigning(true); // ✅ NEW: Set loading state
    
    try {
      const currentMentor = mentors.find(m => m.id === assignMentorId);
      const existingTeam = currentMentor?.mentor_assignments?.[0]?.team_id || null;

      if (existingTeam && existingTeam !== selectedTeam) {
        await removeMentorFromTeam(assignMentorId, existingTeam);
      }

      if (selectedTeam && selectedTeam !== existingTeam) {
        await assignMentorToTeam(assignMentorId, { team_id: selectedTeam });
      }

      await loadMentors();
      
      setShowAssignModal(false);
      showToast("Team assigned successfully!", "success");
    } catch (error: any) {
      console.error('Assignment failed:', error);
      ErrorHandler.handleError(error, showToast, 'assigning team');
    } finally {
      setAssigning(false); // ✅ NEW: Clear loading state
    }
  };

  const columns: TableColumn<typeof mentors[0]>[] = [
    { key: "user", label: "Name", render: (row) => row.user?.name || "-", className: "font-semibold text-blue-800" },
    { key: "expertise", label: "Expertise", className: "text-blue-700" },
    { key: "user", label: "Email", render: (row) => row.user?.email || "-", className: "text-blue-700" },
    { key: "phone", label: "Phone", className: "text-blue-700" },
    {
      key: "mentor_assignments",
      label: "Assigned Team",
      render: row => {
        if (row.mentor_assignments && row.mentor_assignments.length > 0) {
          const assignment = row.mentor_assignments[0];
          return (
            <Badge variant="default" className="bg-green-100 text-green-800">
              {assignment.team?.team_name || "Unknown"}
            </Badge>
          );
        }
        return <span className="text-gray-500">No team assigned</span>;
      },
      className: "text-blue-700"
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900">Mentor Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search by name, expertise, or email..."
          />
          <RoleGuard allowed={["manager"]}>
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
              onClick={openAddModal}
            >
              + Add Mentor
            </button>
          </RoleGuard>
        </div>
      </div>

      {!canModify && (
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded text-sm sm:text-base">
          You do not have permission to add, edit, delete, or assign teams. You can only view the list.
        </div>
      )}

      {/* ✅ NEW: Replaced loading text with PageSkeleton */}
      {loading ? (
        <PageSkeleton count={5} layout="table" />
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
          <div className="min-w-[600px]">
            <Table
              columns={columns}
              data={paginated}
              actions={canModify ? (row) => (
                <div className="flex gap-2">
                  <Tooltip label="Edit">
                    <button
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-700"
                      onClick={() => openEditModal(row)}
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip label="Assign">
                    <button
                      className="p-2 rounded-full hover:bg-green-100 text-green-700"
                      onClick={() => openAssignModal(row)}
                      aria-label="Assign"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <button
                      className="p-2 rounded-full hover:bg-red-100 text-red-700"
                      onClick={() => handleDelete(row.id)}
                      aria-label="Delete"
                      disabled={deleting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              ) : undefined}
              emptyMessage="No mentors found."
            />
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal
        title={isEdit ? "Edit Mentor" : "Add Mentor"}
        open={showModal && canModify}
        onClose={() => { setShowModal(false); setValidationErrors([]); setTouchedFields(new Set()); }}
        actions={
          <>
            {/* ✅ NEW: Using ButtonLoader instead of regular Button */}
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={() => { setShowModal(false); setValidationErrors([]); setTouchedFields(new Set()); }}
              label="Cancel"
              loading={false}
            />
            <ButtonLoader
              type="submit"
              form="mentor-form"
              loading={submitting}
              label={isEdit ? "Save Changes" : "Add Mentor"}
              loadingText={isEdit ? "Saving..." : "Adding..."}
              variant="primary"
            />
          </>
        }
        role="dialog"
        aria-modal="true"
      >
        <form id="mentor-form" onSubmit={handleSubmit}>
          <ValidationErrors 
            errors={validationErrors} 
            onFieldFocus={handleFieldFocus}
          />
          
          <FormField
            label="Name"
            name="name"
            error={getFieldError('name')}
            touched={touchedFields.has('name')}
            required
            autoFocus={focusedField === 'name'}
          >
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('name')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
              disabled={submitting}
            />
          </FormField>
          
          <FormField
            label="Expertise"
            name="expertise"
            error={getFieldError('expertise')}
            touched={touchedFields.has('expertise')}
            required
            autoFocus={focusedField === 'expertise'}
          >
            <input
              id="expertise"
              name="expertise"
              value={form.expertise}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('expertise')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
              disabled={submitting}
            />
          </FormField>
          
          <FormField
            label="Email"
            name="email"
            error={getFieldError('email')}
            touched={touchedFields.has('email')}
            required
            autoFocus={focusedField === 'email'}
          >
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('email')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
              disabled={submitting}
            />
          </FormField>
          
          <FormField
            label="Phone"
            name="phone"
            error={getFieldError('phone')}
            touched={touchedFields.has('phone')}
            autoFocus={focusedField === 'phone'}
          >
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('phone')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              disabled={submitting}
            />
          </FormField>
        </form>
      </Modal>

      {/* Assign Team Modal */}
      <Modal
        title="Assign Team"
        open={showAssignModal && canModify}
        onClose={() => setShowAssignModal(false)}
        actions={
          <>
            {/* ✅ NEW: Using ButtonLoader for modal actions */}
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={() => setShowAssignModal(false)}
              label="Cancel"
              loading={false}
            />
            <ButtonLoader
              type="submit"
              form="assign-form"
              loading={assigning}
              label="Save Assignment"
              loadingText="Assigning..."
              variant="primary"
            />
          </>
        }
        role="dialog"
        aria-modal="true"
      >
        <form id="assign-form" onSubmit={handleAssignSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Select a team to assign to this mentor. Each mentor can only be assigned to one team.
            </p>
            {teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="font-semibold">No teams available</p>
                <p className="text-sm mt-1">Please add teams first before assigning them to mentors.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teams.map((team: any) => {
                  const isSelected = selectedTeam === team.id;
                  const isAssignedToOtherMentor = team.mentor_assignments && 
                    team.mentor_assignments.length > 0 && 
                    team.mentor_assignments[0].mentor_id !== assignMentorId;
                  const assignedMentorName = isAssignedToOtherMentor ? team.mentor_assignments[0].mentor?.user?.name : null;
                  
                  return (
                    <label
                      key={team.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition border-2 ${
                        isAssignedToOtherMentor
                          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-md cursor-pointer'
                          : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="team"
                        checked={isSelected}
                        onChange={() => !isAssignedToOtherMentor && handleTeamSelect(team.id)}
                        disabled={isAssignedToOtherMentor || assigning}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className={`font-semibold ${isSelected ? 'text-blue-900' : isAssignedToOtherMentor ? 'text-gray-500' : 'text-gray-900'}`}>
                          {team.team_name}
                        </div>
                        <div className="text-sm text-gray-600">{team.company_name || 'No company name'}</div>
                        {isAssignedToOtherMentor && (
                          <div className="text-xs text-orange-600 font-semibold mt-1">
                            Already assigned to mentor "{assignedMentorName}"
                          </div>
                        )}
                      </div>
                      {isSelected && !isAssignedToOtherMentor && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorManagement;
