import React, { useState, useEffect } from "react";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getIncubators, getMentors, createIncubator, updateIncubator, deleteIncubator, assignMentorToTeam, removeMentorFromTeam } from "../services/api";
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

// 1. Define types for team and member
interface TeamMember {
  name: string;
  email: string;
  role: string;
}
interface Team {
  id: number;
  teamName: string;
  credentials: { email: string; password: string };
  teamLeader: { name: string; email: string; role: string };
  members: TeamMember[];
  mentor: string;
  status: string;
}

const defaultForm: Team = {
  id: 0,
  teamName: "",
  credentials: { email: "", password: "Team123" },
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
  const [isEdit, setIsEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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

  // Only managers can modify
  const canModify = Boolean(user && user.role === "manager");

  const openAddModal = () => {
    setForm({ ...defaultForm, members: [] });
    setShowModal(true);
  };

  const openEditModal = (team: any) => {
    setForm({
      id: team.id,
      teamName: team.team_name,
      company_name: team.company_name,
      status: team.status,
      credentials: { email: "", password: "" },
      teamLeader: { name: "", email: "", role: "Team Leader" },
      members: [],
      mentor: ""
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "credentialsEmail") {
      setForm((prev: any) => ({ ...prev, credentials: { ...prev.credentials, email: value } }));
    } else if (name === "credentialsPassword") {
      setForm((prev: any) => ({ ...prev, credentials: { ...prev.credentials, password: value } }));
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
    if (!form.teamName || (!isEdit && (!form.credentials.email || !form.credentials.password))) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setValidationErrors([]);
    
    try {
      if (isEdit) {
        await updateIncubator(form.id, {
          team_name: form.teamName,
          company_name: form.company_name || '',
          status: form.status
        });
        setIncubators((prev) =>
          prev.map((team) =>
            team.id === form.id ? { ...team, team_name: form.teamName, company_name: form.company_name, status: form.status } : team
          )
        );
        showToast("Team updated successfully!", "success");
      } else {
        const result = await createIncubator({
          team_name: form.teamName,
          company_name: form.company_name || '',
          credentials: {
            email: form.credentials.email,
            password: form.credentials.password
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
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteIncubator(id);
        setIncubators((prev) => prev.filter((team) => team.id !== id));
        showToast("Team deleted!", "success");
      } catch (error: any) {
        ErrorHandler.handleError(error, showToast, 'deleting team');
      }
    }
  };

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
          <div className="text-center text-blue-400 py-12">Loading teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incubators.length === 0 ? (
              <div className="col-span-full text-center text-blue-400 py-12">No teams found.</div>
            ) : (
              incubators
                .filter(team => team.team_name.toLowerCase().includes(search.toLowerCase()))
                .map((team: any) => (
                  <div key={team.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-blue-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-blue-900">{team.team_name}</h3>
                      {canModify && (
                        <div className="flex gap-2">
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
                          <Tooltip label="Delete Team">
                            <button
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                              onClick={() => handleDelete(team.id)}
                              aria-label="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="text-blue-700">
                        <span className="font-semibold">Company:</span> {team.company_name || 'N/A'}
                      </div>
                      <div className="text-blue-700">
                        <span className="font-semibold">Status:</span>
                        <Badge variant={team.status === "active" ? "success" : team.status === "pending" ? "warning" : "default"} className="ml-2">
                          {team.status}
                        </Badge>
                      </div>
                      <div className="text-blue-700">
                        <span className="font-semibold">Mentor:</span>
                        {team.mentor_assignments && team.mentor_assignments.length > 0 ? (
                          <Badge variant="default" className="bg-purple-100 text-purple-800 ml-2">
                            {team.mentor_assignments[0].mentor?.user?.name || 'Unknown'}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 ml-2">No mentor assigned</span>
                        )}
                      </div>
                      <div className="text-blue-700">
                        <span className="font-semibold">Created:</span> {new Date(team.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {canModify && (
                      <div className="mt-4 pt-4 border-t border-blue-100">
                        <button
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold shadow hover:from-purple-700 hover:to-purple-600 transition flex items-center justify-center gap-2"
                          onClick={() => openMentorModal(team)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          Assign Mentor
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
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
            label="Team Name"
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
            />
          </FormField>
          
          <FormField
            label="Company Name"
            name="company_name"
            error={getFieldError('company_name')}
            touched={touchedFields.has('company_name')}
            autoFocus={focusedField === 'company_name'}
          >
            <input
              id="company_name"
              name="company_name"
              value={form.company_name || ''}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('company_name')}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
            />
          </FormField>
          
          {!isEdit && (
            <>
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
                />
              </FormField>
              
              <FormField
                label="Team Leader Password"
                name="password"
                error={getFieldError('password')}
                touched={touchedFields.has('password')}
                required
                autoFocus={focusedField === 'password'}
                helperText="Minimum 6 characters"
              >
                <input
                  id="password"
                  name="credentialsPassword"
                  type="password"
                  value={form.credentials.password}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('password')}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  required
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
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setValidationErrors([]); setTouchedFields(new Set()); }}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Team" : "Create Team"}
            </Button>
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
            <Button variant="secondary" type="button" onClick={() => setShowMentorModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="mentor-assign-form">
              Save Assignment
            </Button>
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
                        onChange={() => !isAssignedToOtherTeam && handleMentorSelect(mentor.id)}
                        disabled={isAssignedToOtherTeam}
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
    </ErrorBoundary>
  );
};

export default IncubatorManagement;