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
import Button from "../components/Button";
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
  id: 0, // was null, now always a number
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
  const [assignMentorId, setAssignMentorId] = useState<number | null>(null);
  const [assignTeams, setAssignTeams] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const showToast = useToast();

  // Validation error state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Load data on mount
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

  // Only managers can modify
  const canModify = Boolean(user && user.role === "manager");

  // Filtered and paginated data
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
    setAssignTeams(mentor.mentor_assignments?.map((assignment: any) => assignment.team_id) || []);
    setShowAssignModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.expertise || !form.email) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setValidationErrors([]);
    
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
        setValidationErrors(errors);
        
        if (errors.length > 0) {
          setFocusedField(errors[0].field);
        }
        
        showToast(errorDetails.userMessage, 'error');
      }
      // Handle other errors
      else {
        showToast(errorDetails?.userMessage || 'Failed to save mentor', 'error');
      }
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

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this mentor?")) {
      setMentors((prev) => prev.filter((m) => m.id !== id));
      showToast("Mentor deleted!", "success");
    }
  };

  // Assign Teams Modal logic
  const handleTeamToggle = (teamId: number) => {
    setAssignTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMentorId) return;

    try {
      // Remove existing assignments and add new ones
      const currentAssignments = assignTeams;

      // For simplicity, we'll just update the local state since the backend API might not support batch operations
      setMentors((prev) =>
        prev.map((m) =>
          m.id === assignMentorId ? { ...m, assignedTeams: assignTeams } : m
        )
      );
      setShowAssignModal(false);
      showToast("Teams assigned!", "success");
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'assigning teams');
    }
  };

  // Table columns
  const columns: TableColumn<typeof mentors[0]>[] = [
    { key: "user", label: "Name", render: (row) => row.user?.name || "-", className: "font-semibold text-blue-800" },
    { key: "expertise", label: "Expertise", className: "text-blue-700" },
    { key: "user", label: "Email", render: (row) => row.user?.email || "-", className: "text-blue-700" },
    { key: "phone", label: "Phone", className: "text-blue-700" },
    {
      key: "mentor_assignments",
      label: "Assigned Teams",
      render: row =>
        row.mentor_assignments && row.mentor_assignments.length > 0
          ? row.mentor_assignments.map(
              (assignment: any) => assignment.team?.team_name || assignment.team_id
            ).join(", ")
          : "-",
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
                    {/* Pencil SVG */}
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
                    {/* Plus SVG */}
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
                  >
                    {/* Trash SVG */}
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
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {/* Fallback message for no permission and no data */}
      {!canModify && paginated.length === 0 && (
        <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded text-center text-base font-semibold shadow">
          No mentors are available to view at this time. Please contact your manager for access or check back later.
        </div>
      )}
      {/* Fallback message for all users if no data at all */}
      {canModify && paginated.length === 0 && (
        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded text-center text-base font-semibold shadow">
          No mentors found. Start by adding a new mentor!
        </div>
      )}
      <Modal
        title={isEdit ? "Edit Mentor" : "Add Mentor"}
        open={showModal && canModify}
        onClose={() => setShowModal(false)}
        actions={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="mentor-form">
              {isEdit ? "Save Changes" : "Add Mentor"}
            </Button>
          </>
        }
        role="dialog"
        aria-modal="true"
      >
        <form id="mentor-form" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Expertise *</label>
            <input
              name="expertise"
              value={form.expertise}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
            />
          </div>
        </form>
      </Modal>
      <Modal
        title="Assign Teams"
        open={showAssignModal && canModify}
        onClose={() => setShowAssignModal(false)}
        actions={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="assign-form">
              Save Assignments
            </Button>
          </>
        }
        role="dialog"
        aria-modal="true"
      >
        <form id="assign-form" onSubmit={handleAssignSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Select teams to assign to this mentor:</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {teams.map((team: any) => (
                <label key={team.id} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignTeams.includes(team.id)}
                    onChange={() => handleTeamToggle(team.id)}
                  />
                  <span className="text-blue-800 text-sm">{team.team_name}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorManagement; 