import React, { useState } from "react";
import { incubators as mockIncubators, mentors } from "../mock/sampleData";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import Table from "../components/Table";
import type { TableColumn } from "../components/Table";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import RoleGuard from "../components/RoleGuard";
import Tooltip from "../components/Tooltip";

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

const IncubatorManagement = () => {
  const { user } = useAuth();
  const [incubators, setIncubators] = useState<Team[]>([...mockIncubators]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Team>({ ...defaultForm });
  const [isEdit, setIsEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const showToast = useToast();

  // Add state for detail modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtered and paginated data
  const filtered = incubators.filter(
    (team) =>
      team.teamName.toLowerCase().includes(search.toLowerCase()) ||
      team.teamLeader.name.toLowerCase().includes(search.toLowerCase()) ||
      team.mentor.toLowerCase().includes(search.toLowerCase())
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
      setForm((prev) => ({ ...prev, credentials: { ...prev.credentials, email: value } }));
    } else if (name === "credentialsPassword") {
      setForm((prev) => ({ ...prev, credentials: { ...prev.credentials, password: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMemberChange = (idx: number, field: keyof TeamMember, value: string) => {
    setForm((prev) => {
      const members = [...prev.members];
      members[idx] = { ...members[idx], [field]: value };
      return { ...prev, members };
    });
  };

  const addMember = () => {
    setForm((prev) => ({ ...prev, members: [...prev.members, { name: "", email: "", role: "Member" }] }));
  };

  const removeMember = (idx: number) => {
    setForm((prev) => {
      const members = prev.members.filter((_, i) => i !== idx);
      return { ...prev, members };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.teamName || !form.credentials.email || !form.credentials.password || !form.mentor) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    if (isEdit) {
      setIncubators((prev) =>
        prev.map((team) =>
          team.id === form.id ? { ...form } : team
        )
      );
      showToast("Team updated!", "success");
    } else {
      setIncubators((prev) => [
        ...prev,
        {
          ...form,
          id: Math.max(0, ...prev.map((team) => team.id)) + 1,
          members: [],
          teamLeader: { name: "", email: "", role: "Team Leader" },
        },
      ]);
      showToast("Team added!", "success");
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      setIncubators((prev) => prev.filter((team) => team.id !== id));
      showToast("Team deleted!", "success");
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
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} />, className: "" },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900">Incubator & Project Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search by name, project, or mentor..."
          />
          <RoleGuard allowed={["manager"]}>
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
              onClick={openAddModal}
            >
              + Add Incubator/Team
            </button>
          </RoleGuard>
        </div>
      </div>
      {!canModify && (
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded text-sm sm:text-base">
          You do not have permission to add, edit, or delete teams. You can only view the list.
        </div>
      )}
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <div className="min-w-[600px]">
          <Table
            columns={columns}
            data={paginated}
            actions={canModify ? (row: Team) => (
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
                <Tooltip label="View Details">
                  <button
                    className="p-2 rounded hover:bg-blue-200 text-blue-700"
                    onClick={() => openDetailModal(row)}
                    aria-label="View Team Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            ) : undefined}
            emptyMessage="No teams found."
          />
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {/* Fallback message for no permission and no data */}
      {!canModify && paginated.length === 0 && (
        <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded text-center text-base font-semibold shadow">
          No teams are available to view at this time. Please contact your manager for access or check back later.
        </div>
      )}
      {/* Fallback message for all users if no data at all */}
      {canModify && paginated.length === 0 && (
        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded text-center text-base font-semibold shadow">
          No teams found. Start by adding a new incubator team!
        </div>
      )}
      <Modal
        title={isEdit ? "Edit Incubator/Team" : "Add Incubator/Team"}
        open={showModal && canModify}
        onClose={() => setShowModal(false)}
        actions={
          <>
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-blue-700 rounded font-semibold hover:bg-gray-300"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="incubator-form"
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
            >
              {isEdit ? "Save Changes" : "Add Team"}
            </button>
          </>
        }
      >
        <form id="incubator-form" onSubmit={handleSubmit}>
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
            <label className="block mb-1 font-semibold text-blue-800">Credentials (Email *)</label>
            <input
              name="credentialsEmail"
              value={form.credentials.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Credentials (Password *)</label>
            <input
              name="credentialsPassword"
              type="text"
              value={form.credentials.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Mentor *</label>
            <select
              name="mentor"
              value={form.mentor}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            >
              <option value="">Select Mentor</option>
              {mentors.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Detail Modal for managing team members */}
      {showDetailModal && selectedTeam && (
        <Modal open={showDetailModal} onClose={closeDetailModal} title={`Team: ${selectedTeam.teamName}`}>
          <div>
            <div className="mb-4">
              <div className="font-semibold text-blue-900">Team Leader:</div> <span className="text-gray-800">{selectedTeam.teamLeader?.name ? `${selectedTeam.teamLeader.name} (${selectedTeam.teamLeader.email})` : 'Not assigned yet.'}</span>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2 text-blue-900">Members:</div>
              {selectedTeam.members.length === 0 ? (
                <div className="text-gray-500 italic">No members yet. Team can add members after login.</div>
              ) : (
                <ul className="space-y-2">
                  {selectedTeam.members.map((member, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-800">
                      <span>{member.name} ({member.role}) - {member.email}</span>
                      {(user && user.role === "manager") || (user && user.role === "incubator" && 'teamId' in user && user.teamId === selectedTeam.id && member.role !== "Team Leader") ? (
                        <button
                          className="ml-2 p-1 rounded hover:bg-red-100 text-red-700"
                          onClick={() => handleRemoveMember(idx)}
                          aria-label="Remove Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {(user && user.role === "manager") || (user && user.role === "incubator" && 'teamId' in user && user.teamId === selectedTeam.id) ? (
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleAddMember}
                >
                  Add Member
                </button>
              ) : null}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IncubatorManagement; 