import React, { useState, useEffect } from "react";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getIncubators, getMentors, createIncubator, updateIncubator, deleteIncubator, assignMentorToTeam, removeMentorFromTeam, restoreTeam, getInactiveTeams } from "../services/api";
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
import StatusBadge from "../components/StatusBadge";
import RoleGuard from "../components/RoleGuard";
import Tooltip from "../components/Tooltip";
import Button from "../components/Button";
import Badge from "../components/Badge";
import SectionTitle from "../components/SectionTitle";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import RestoreConfirmationModal from "../components/RestoreConfirmationModal";

// 1. Define types for team and member
interface TeamMember {
  name: string;
  email: string;
  role: string;
}
interface Team {
  id: number;
  teamName: string;
  credentials: { name: string; email: string };
  teamLeader: { name: string; email: string; role: string };
  members: TeamMember[];
  mentor: string;
  status: string;
}

const defaultForm: Team = {
  id: 0,
  teamName: "",
  credentials: { name: "", email: "" },
  teamLeader: { name: "", email: "", role: "Team Leader" }, // will be set by team after login
  members: [],
  mentor: "",
  status: "Active",
};

const PAGE_SIZE = 5;

// ErrorBoundary for error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { /* log error */ }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-700 font-bold">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const IncubatorManagement = () => {
  const { user } = useAuth();
  const [incubators, setIncubators] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...defaultForm });
  
  // Loading states for individual actions
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigningMentor, setAssigningMentor] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveTeams, setInactiveTeams] = useState<any[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [teamToRestore, setTeamToRestore] = useState<any | null>(null);
  const showToast = useToast();

  // Validation error state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Mentor assignment state
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadIncubators();
      loadMentors();
    }
  }, [user]);

  // Load inactive teams when toggle is switched
  useEffect(() => {
    if (showInactive) {
      loadInactiveTeams();
    }
  }, [showInactive, page]);

  const loadIncubators = async () => {
    try {
      const data = await withRetry(
        () => getIncubators(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            showToast(`Retrying... (${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setIncubators(data);
    } catch (error: any) {
      console.error('Failed to load incubators:', error);
      const errorDetails = ErrorHandler.parse(error);
      
      if (ErrorHandler.isTimeout(error)) {
        showToast('Request timed out. Please try again.', 'error');
      } else if (ErrorHandler.isServiceUnavailable(error)) {
        showToast('Service temporarily unavailable. Please try again later.', 'error');
      } else {
        showToast(errorDetails.userMessage || 'Failed to load teams', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const data = await withRetry(() => getMentors(), { maxRetries: 2 });
      setMentors(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading mentors');
    }
  };

  // Add state for detail modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtered and paginated data
  const filtered = incubators.filter(
    (team) =>
      team.team_name.toLowerCase().includes(search.toLowerCase()) ||
      team.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      team.status?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Managers and Directors can modify
  const canModify = Boolean(user && (user.role === "manager" || user.role === "director"));

  const openAddModal = () => {
    setForm({ ...defaultForm, members: [] });
    setShowModal(true);
  };

  const openEditModal = (team: any) => {
    setForm({
      id: team.id,
      teamName: team.team_name || team.company_name, // Use team_name, fallback to company_name if needed
      company_name: team.company_name, // Keep for backward compatibility but won't be displayed
      status: team.status,
      credentials: { name: "", email: "" },
      teamLeader: { name: "", email: "", role: "Team Leader" },
      members: [],
      mentor: ""
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "credentialsName") {
      setForm((prev: any) => ({ ...prev, credentials: { ...prev.credentials, name: value } }));
    } else if (name === "credentialsEmail") {
      setForm((prev: any) => ({ ...prev, credentials: { ...prev.credentials, email: value } }));
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleMemberChange = (idx: number, field: keyof TeamMember, value: string) => {
    setForm((prev: any) => {
      const members = [...prev.members];
      members[idx] = { ...members[idx], [field]: value };
      return { ...prev, members };
    });
  };

  const addMember = () => {
    setForm((prev: any) => ({ ...prev, members: [...prev.members, { name: "", email: "", role: "Member" }] }));
  };

  const removeMember = (idx: number) => {
    setForm((prev: any) => {
      const members = prev.members.filter((_: any, i: number) => i !== idx);
      return { ...prev, members };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.teamName || (!isEdit && (!form.credentials.name || !form.credentials.email))) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);
    
    try {
      if (isEdit) {
        await updateIncubator(form.id, {
          team_name: form.teamName,
          company_name: form.teamName, // Use same value for both
          status: form.status
        });
        setIncubators((prev) =>
          prev.map((team) =>
            team.id === form.id ? { ...team, team_name: form.teamName, company_name: form.teamName, status: form.status } : team
          )
        );
        showToast("Team updated successfully!", "success");
      } else {
        const result = await createIncubator({
          team_name: form.teamName,
          company_name: form.teamName, // Use same value for both
          credentials: {
            name: form.credentials.name,
            email: form.credentials.email
          }
        });
        if (result.success && result.data?.team) {
          setIncubators((prev) => [...prev, result.data.team]);
        }
        showToast("Team created successfully!", "success");
      }
      setShowModal(false);
      setValidationErrors([]);
      setTouchedFields(new Set());
    } catch (error: any) {
      console.error('Failed to save team:', error);
      const errorDetails = error.errorDetails;
      
      // Handle 422 - Business Logic Errors
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
      }
      // Handle 400 - Validation Errors
      else if (errorDetails?.status === 400) {
        const errors = ErrorHandler.parseValidationErrors(errorDetails);
        
        // Map backend field names to frontend field names
        const mappedErrors = errors.map(err => ({
          ...err,
          field: err.field.replace('credentials.', '') // Map credentials.email -> email
        }));
        
        setValidationErrors(mappedErrors);
        
        if (mappedErrors.length > 0) {
          setFocusedField(mappedErrors[0].field);
        }
        
        showToast(errorDetails.userMessage, 'error');
      }
      // Handle other errors
      else {
        showToast(errorDetails?.userMessage || 'Failed to save team', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (team: any) => {
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;

    setDeleting(true);
    try {
      await deleteIncubator(teamToDelete.id);
      // Remove from active list and refresh
      setIncubators((prev) => prev.filter((team) => team.id !== teamToDelete.id));
      showToast("Team deactivated successfully. You can restore it later.", "success");
      setDeleteModalOpen(false);
      setTeamToDelete(null);
      // Reload inactive teams if showing inactive view
      if (showInactive) {
        loadInactiveTeams();
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deactivating team');
      // Don't close modal on error so user can retry
    } finally {
      setDeleting(false);
    }
  };

  const loadInactiveTeams = async () => {
    try {
      setLoadingInactive(true);
      const response = await getInactiveTeams({ page, limit: PAGE_SIZE });
      const teams = Array.isArray(response) ? response : (response?.data?.teams || response?.teams || []);
      setInactiveTeams(teams);
    } catch (error: any) {
      console.error('Failed to load inactive teams:', error);
      ErrorHandler.handleError(error, showToast, 'loading inactive teams');
      setInactiveTeams([]);
    } finally {
      setLoadingInactive(false);
    }
  };

  const handleRestoreClick = (team: any) => {
    setTeamToRestore(team);
    setRestoreModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!teamToRestore) return;

    setRestoring(teamToRestore.id);
    try {
      await restoreTeam(teamToRestore.id);
      showToast("Team restored successfully!", "success");
      // Remove from inactive list and refresh active list
      setInactiveTeams((prev) => prev.filter((team) => team.id !== teamToRestore.id));
      loadIncubators();
      setRestoreModalOpen(false);
      setTeamToRestore(null);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'restoring team');
    } finally {
      setRestoring(null);
    }
  };

  useEffect(() => {
    if (showInactive) {
      loadInactiveTeams();
    }
  }, [showInactive, page]);

  // Mentor assignment handlers
  const openMentorModal = (team: any) => {
    setAssignTeamId(team.id);
    // Get current mentor assignment for this team (only one mentor per team)
    const currentMentor = team.mentor_assignments?.[0]?.mentor_id || null;
    setSelectedMentor(currentMentor);
    setShowMentorModal(true);
  };

  const handleMentorSelect = (mentorId: string) => {
    // Allow deselecting by clicking the same radio button
    setSelectedMentor(prev => prev === mentorId ? null : mentorId);
  };

  const handleMentorAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeamId) return;

    setAssigningMentor(true);
    try {
      // Get current team to find existing assignment
      const currentTeam = incubators.find(t => t.id === assignTeamId);
      const existingMentor = currentTeam?.mentor_assignments?.[0]?.mentor_id || null;

      console.log('=== ASSIGNING MENTOR TO TEAM DEBUG ===');
      console.log('Team ID:', assignTeamId);
      console.log('Selected Mentor ID:', selectedMentor);
      console.log('Existing Mentor ID:', existingMentor);
      console.log('Team ID type:', typeof assignTeamId);
      console.log('Selected Mentor type:', typeof selectedMentor);

      // If there's an existing mentor and it's different from the selected one, remove it
      if (existingMentor && existingMentor !== selectedMentor) {
        console.log('Removing existing mentor...');
        await removeMentorFromTeam(existingMentor, assignTeamId);
      }

      // If a mentor is selected and it's different from the existing one, add it
      if (selectedMentor && selectedMentor !== existingMentor) {
        console.log('Adding new mentor...');
        console.log('Request payload:', { team_id: assignTeamId });
        await assignMentorToTeam(selectedMentor, { team_id: assignTeamId });
      }

      // Reload teams to get updated assignments
      await loadIncubators();
      
      setShowMentorModal(false);
      showToast("Mentor assigned successfully!", "success");
    } catch (error: any) {
      console.error('=== ASSIGNMENT FAILED ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      ErrorHandler.handleError(error, showToast, 'assigning mentor');
    } finally {
      setAssigningMentor(false);
    }
  };

  // Helper functions for validation
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

  // Function to open detail modal
  const openDetailModal = (team: Team) => {
    setSelectedTeam(team);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => {
    setSelectedTeam(null);
    setShowDetailModal(false);
  };

  // Implement handleRemoveMember and handleAddMember functions to update the selectedTeam's members (with state update logic)
  const handleRemoveMember = (idx: number) => {
    setSelectedTeam((prev) => {
      if (!prev) return prev;
      const members = [...prev.members];
      members.splice(idx, 1);
      return { ...prev, members };
    });
  };

  const handleAddMember = () => {
    setSelectedTeam((prev) => {
      if (!prev) return prev;
      return { ...prev, members: [...prev.members, { name: "", email: "", role: "Member" }] };
    });
  };

  // Table columns
  const columns: TableColumn<Team>[] = [
    { key: "teamName", label: "Team Name", className: "font-semibold text-blue-800" },
    { key: "teamLeader", label: "Team Leader", render: (row) => row.teamLeader?.name || "-", className: "text-blue-700" },
    { key: "members", label: "Members", render: (row) => row.members.length, className: "text-blue-700" },
    { key: "mentor", label: "Mentor", className: "text-blue-700" },
    { key: "status", label: "Status", render: (row) => <Badge variant={row.status === "Active" ? "success" : row.status === "Pending" ? "warning" : "default"}>{row.status}</Badge>, className: "" },
  ];

  return (
    <ErrorBoundary>
      <div className="p-2 sm:p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <SectionTitle className="text-2xl sm:text-3xl font-extrabold">Team Management</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Search by team name..."
            />
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded font-semibold shadow hover:bg-gray-200 transition"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? "Show Active Teams" : "Show Inactive Teams"}
            </button>
            {canModify && (
              <button
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
                onClick={openAddModal}
              >
                + Add Team
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <PageSkeleton count={6} layout="table" />
        ) : showInactive ? (
          loadingInactive ? (
            <PageSkeleton count={6} layout="table" />
          ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Inactive Teams</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Team Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Deactivated At</th>
                    {canModify && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inactiveTeams.length === 0 ? (
                    <tr>
                      <td colSpan={canModify ? 4 : 3} className="px-4 py-12 text-center text-gray-400">
                        No inactive teams found.
                      </td>
                    </tr>
                  ) : (
                    inactiveTeams.map((team: any) => (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-semibold">{team.team_name}</td>
                        <td className="px-4 py-3 text-gray-700">{team.company_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {team.deactivated_at ? new Date(team.deactivated_at).toLocaleDateString() : 'N/A'}
                        </td>
                        {canModify && (
                          <td className="px-4 py-3">
                            <Tooltip label="Restore Team">
                              <button
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                onClick={() => handleRestoreClick(team)}
                                disabled={restoring === team.id}
                                aria-label="Restore"
                              >
                                {restoring === team.id ? (
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                  </svg>
                                )}
                              </button>
                            </Tooltip>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Team Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Mentor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Created</th>
                    {canModify && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
            {incubators.length === 0 ? (
                    <tr>
                      <td colSpan={canModify ? 6 : 5} className="px-4 py-12 text-center text-blue-400">
                        No teams found.
                      </td>
                    </tr>
            ) : (
              incubators
                .filter(team => team.team_name.toLowerCase().includes(search.toLowerCase()))
                .map((team: any) => (
                        <tr key={team.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-blue-900 font-semibold">{team.team_name}</td>
                          <td className="px-4 py-3 text-blue-700">{team.company_name || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={team.status === "active" ? "success" : team.status === "pending" ? "warning" : "default"}>
                              {team.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-blue-700">
                            {team.mentor_assignments && team.mentor_assignments.length > 0 ? (
                              <Badge variant="default" className="bg-purple-100 text-purple-800">
                                {team.mentor_assignments[0].mentor?.user?.name || 'Unknown'}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">No mentor assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-blue-700">{new Date(team.created_at).toLocaleDateString()}</td>
                      {canModify && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                          <Tooltip label="Edit Team">
                            <button
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                              onClick={() => openEditModal(team)}
                              aria-label="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
                              </svg>
                            </button>
                          </Tooltip>
                          <Tooltip label="Deactivate Team">
                            <button
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                              onClick={() => handleDeleteClick(team)}
                              aria-label="Deactivate"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </Tooltip>
                                <Tooltip label="Assign Mentor">
                        <button
                                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                          onClick={() => openMentorModal(team)}
                                    aria-label="Assign Mentor"
                        >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </button>
                                </Tooltip>
                      </div>
                            </td>
                    )}
                        </tr>
                ))
            )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Team Modal */}
      <Modal
        title={isEdit ? "Edit Team" : "Add New Team"}
        open={showModal && canModify}
        onClose={() => { setShowModal(false); setValidationErrors([]); setTouchedFields(new Set()); }}
        actions={null}
        role="dialog"
        aria-modal="true"
      >
        <form onSubmit={handleSubmit}>
          <ValidationErrors 
            errors={validationErrors} 
            onFieldFocus={handleFieldFocus}
          />
          
          <FormField
            label="Company Name"
            name="team_name"
            error={getFieldError('team_name')}
            touched={touchedFields.has('team_name')}
            required
            autoFocus={focusedField === 'team_name'}
          >
            <input
              id="team_name"
              name="teamName"
              value={form.teamName}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('team_name')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
              disabled={submitting}
              placeholder="Enter company name"
            />
          </FormField>
          
          {!isEdit && (
            <>
              <FormField
                label="Team Leader Name"
                name="credentials_name"
                error={getFieldError('credentials.name')}
                touched={touchedFields.has('credentials.name')}
                required
                autoFocus={focusedField === 'credentials.name'}
              >
                <input
                  id="credentials_name"
                  name="credentialsName"
                  type="text"
                  value={form.credentials.name}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('credentials.name')}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  required
                  disabled={submitting}
                />
              </FormField>

              <FormField
                label="Team Leader Email"
                name="email"
                error={getFieldError('email')}
                touched={touchedFields.has('email')}
                required
                autoFocus={focusedField === 'email'}
              >
                <input
                  id="email"
                  name="credentialsEmail"
                  type="email"
                  value={form.credentials.email}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('email')}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  required
                  disabled={submitting}
                />
              </FormField>
            </>
          )}
          
          <FormField
            label="Status"
            name="status"
            error={getFieldError('status')}
            touched={touchedFields.has('status')}
            autoFocus={focusedField === 'status'}
          >
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('status')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          
          <div className="flex gap-2 justify-end">
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={() => { setShowModal(false); setValidationErrors([]); setTouchedFields(new Set()); }}
              label="Cancel"
              loading={false}
            />
            <ButtonLoader
              type="submit"
              loading={submitting}
              label={isEdit ? "Update Team" : "Create Team"}
              loadingText={isEdit ? "Updating..." : "Creating..."}
              variant="primary"
            />
          </div>
        </form>
      </Modal>

      {/* Mentor Assignment Modal */}
      <Modal
        title="Assign Mentor"
        open={showMentorModal && canModify}
        onClose={() => setShowMentorModal(false)}
        actions={
          <>
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={() => setShowMentorModal(false)}
              label="Cancel"
              loading={false}
            />
            <ButtonLoader
              type="submit"
              form="mentor-assign-form"
              loading={assigningMentor}
              label="Save Assignment"
              loadingText="Assigning..."
              variant="primary"
            />
          </>
        }
        role="dialog"
        aria-modal="true"
      >
        <form id="mentor-assign-form" onSubmit={handleMentorAssignSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Select a mentor to assign to this team. Each team can only have one mentor. Click the selected mentor again to unassign.
            </p>
            {mentors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <p className="font-semibold">No mentors available</p>
                <p className="text-sm mt-1">Please add mentors first before assigning them to teams.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mentors.map((mentor: any) => {
                  const isSelected = selectedMentor === mentor.id;
                  const isAssignedToOtherTeam = mentor.mentor_assignments && 
                    mentor.mentor_assignments.length > 0 && 
                    mentor.mentor_assignments[0].team_id !== assignTeamId;
                  const assignedTeamName = isAssignedToOtherTeam ? mentor.mentor_assignments[0].team?.team_name : null;
                  
                  return (
                    <label
                      key={mentor.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition border-2 ${
                        isAssignedToOtherTeam
                          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-md cursor-pointer'
                          : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mentor"
                        checked={isSelected}
                        onChange={() => !isAssignedToOtherTeam && !assigningMentor && handleMentorSelect(mentor.id)}
                        disabled={isAssignedToOtherTeam || assigningMentor}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className={`font-semibold ${isSelected ? 'text-blue-900' : isAssignedToOtherTeam ? 'text-gray-500' : 'text-gray-900'}`}>
                          {mentor.user?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">{mentor.expertise || 'No expertise listed'}</div>
                        <div className="text-xs text-gray-500">{mentor.user?.email || ''}</div>
                        {isAssignedToOtherTeam && (
                          <div className="text-xs text-orange-600 font-semibold mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            Already assigned to "{assignedTeamName}"
                          </div>
                        )}
                      </div>
                      {isSelected && !isAssignedToOtherTeam && (
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
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={teamToDelete?.team_name}
        itemType="team"
        loading={deleting}
        description="This will deactivate the team. The team will be hidden from active lists but can be restored later. Team data will be preserved."
        confirmationText={null}
      />
    </ErrorBoundary>
  );
};

export default IncubatorManagement;