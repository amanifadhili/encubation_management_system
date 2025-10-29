import React, { useState, useEffect } from "react";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getIncubators, getMentors, createIncubator, updateIncubator, deleteIncubator } from "../services/api";
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

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadIncubators();
      loadMentors();
    }
  }, [user]);

  const loadIncubators = async () => {
    try {
      const data = await getIncubators();
      setIncubators(data);
    } catch (error) {
      console.error('Failed to load incubators:', error);
      showToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const data = await getMentors();
      setMentors(data);
    } catch (error) {
      console.error('Failed to load mentors:', error);
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

  const openEditModal = (team: Team) => {
    setForm({ ...team });
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
    if (!form.teamName || !form.credentials.email || !form.credentials.password) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    try {
      if (isEdit) {
        await updateIncubator(form.id, {
          team_name: form.teamName,
          company_name: form.company_name || '',
          status: form.status
        });
        // Update the team in the list
        setIncubators((prev) =>
          prev.map((team) =>
            team.id === form.id ? { ...team, team_name: form.teamName, company_name: form.company_name, status: form.status } : team
          )
        );
        showToast("Team updated!", "success");
      } else {
        const result = await createIncubator({
          team_name: form.teamName,
          company_name: form.company_name || '',
          email: form.credentials.email,
          password: form.credentials.password
        });
        // Add the new team to the list
        if (result.success && result.data?.team) {
          setIncubators((prev) => [...prev, result.data.team]);
        }
        showToast("Team created!", "success");
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to save team:', error);
      showToast(error.response?.data?.message || 'Failed to save team', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteIncubator(id);
        setIncubators((prev) => prev.filter((team) => team.id !== id));
        showToast("Team deleted!", "success");
      } catch (error: any) {
        console.error('Failed to delete team:', error);
        showToast(error.response?.data?.message || 'Failed to delete team', 'error');
      }
    }
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
                  <div key={team.id} className="bg-white rounded shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-blue-900">{team.team_name}</h3>
                      {canModify && (
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                            onClick={() => openEditModal(team)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            onClick={() => handleDelete(team.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-blue-700 mb-1">
                      <span className="font-semibold">Company:</span> {team.company_name || 'N/A'}
                    </div>
                    <div className="text-blue-700 mb-1">
                      <span className="font-semibold">Status:</span>
                      <Badge variant={team.status === "active" ? "success" : team.status === "pending" ? "warning" : "default"} className="ml-2">
                        {team.status}
                      </Badge>
                    </div>
                    <div className="text-blue-700">
                      <span className="font-semibold">Created:</span> {new Date(team.created_at).toLocaleDateString()}
                    </div>
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
        onClose={() => setShowModal(false)}
        actions={null}
        role="dialog"
        aria-modal="true"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Team Name *</label>
            <input
              name="teamName"
              value={form.teamName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Company Name</label>
            <input
              name="company_name"
              value={form.company_name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
            />
          </div>
          {!isEdit && (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Team Leader Email *</label>
                <input
                  name="credentialsEmail"
                  type="email"
                  value={form.credentials.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Team Leader Password *</label>
                <input
                  name="credentialsPassword"
                  type="password"
                  value={form.credentials.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  required
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Team" : "Create Team"}
            </Button>
          </div>
        </form>
      </Modal>
    </ErrorBoundary>
  );
};

export default IncubatorManagement;