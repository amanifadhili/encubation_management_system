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

const defaultForm = {
  id: 0, // was null, now always a number
  name: "",
  project: "",
  members: [""],
  mentor: "",
  status: "Active",
  file: null,
};

const PAGE_SIZE = 5;

const IncubatorManagement = () => {
  const { user } = useAuth();
  const [incubators, setIncubators] = useState([...mockIncubators]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [isEdit, setIsEdit] = useState(false);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const showToast = useToast();

  // Filtered and paginated data
  const filtered = incubators.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.project.toLowerCase().includes(search.toLowerCase()) ||
      team.mentor.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Only managers can modify
  const canModify = Boolean(user && user.role === "manager");

  const openAddModal = () => {
    setForm({ ...defaultForm, members: [""] });
    setFileName("");
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (team: typeof mockIncubators[0]) => {
    setForm({ ...team, file: null });
    setFileName("");
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (idx: number, value: string) => {
    setForm((prev) => {
      const members = [...prev.members];
      members[idx] = value;
      return { ...prev, members };
    });
  };

  const addMember = () => {
    setForm((prev) => ({ ...prev, members: [...prev.members, ""] }));
  };

  const removeMember = (idx: number) => {
    setForm((prev) => {
      const members = prev.members.filter((_, i) => i !== idx);
      return { ...prev, members };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    setForm((prev) => ({ ...prev, file: null })); // always set to null for SSR safety
    setFileName(file ? file.name : "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.project || !form.mentor) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    if (isEdit) {
      setIncubators((prev) =>
        prev.map((team) =>
          team.id === form.id ? { ...form, file: null } : team
        )
      );
      showToast("Team updated!", "success");
    } else {
      setIncubators((prev) => [
        ...prev,
        {
          ...form,
          id: Math.max(0, ...prev.map((team) => team.id)) + 1,
          file: null,
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

  // Table columns
  const columns: TableColumn<typeof incubators[0]>[] = [
    { key: "name", label: "Name", className: "font-semibold text-blue-800" },
    { key: "project", label: "Project", className: "text-blue-700" },
    { key: "members", label: "Members", render: row => row.members.join(", "), className: "text-blue-700" },
    { key: "mentor", label: "Mentor", className: "text-blue-700" },
    { key: "status", label: "Status", render: row => <StatusBadge status={row.status} /> },
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
            actions={canModify ? (row) => (
              <div className="flex gap-2">
                <Tooltip label="Edit">
                  <button
                    className="p-2 rounded-full hover:bg-blue-100 text-blue-700"
                    onClick={() => openEditModal(row)}
                    aria-label="Edit"
                  >
                    <span className="material-icons">edit</span>
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    className="p-2 rounded-full hover:bg-red-100 text-red-700"
                    onClick={() => handleDelete(row.id)}
                    aria-label="Delete"
                  >
                    <span className="material-icons">delete</span>
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
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Project *</label>
            <input
              name="project"
              value={form.project}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Members</label>
            {form.members.map((member, idx) => (
              <div key={idx} className="flex items-center mb-1 gap-2">
                <input
                  value={member}
                  onChange={e => handleMemberChange(idx, e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-red-200 text-red-700 rounded hover:bg-red-300"
                  onClick={() => removeMember(idx)}
                  disabled={form.members.length === 1}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="mt-1 px-2 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
              onClick={addMember}
            >
              + Add Member
            </button>
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
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">File Upload (mocked)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full"
            />
            {fileName && <div className="mt-1 text-sm text-blue-700">Selected: {fileName}</div>}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncubatorManagement; 