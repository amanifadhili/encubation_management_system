import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { incubators, projects as mockProjects, mentors } from "../mock/sampleData";
import Modal from "../components/Modal";
import Button from "../components/Button";

const categories = ["All", "Technology", "Agriculture", "Health", "Education"];
const statusOptions = ["All", "Active", "Pending", "Completed"];

function getFileUrl(file: File) {
  return URL.createObjectURL(file);
}

const Projects = () => {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const isDirector = user?.role === "director";
  const isMentor = user?.role === "mentor";
  const isIncubator = user?.role === "incubator";
  const teamId = isIncubator ? (user as any).teamId : null;

  // Mentor: get assigned teams
  const mentorTeams = isMentor ? mentors.find(m => m.name === user.name)?.assignedTeams || [] : [];

  // Local state for projects
  const [projects, setProjects] = useState(mockProjects);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: categories[1],
    status: statusOptions[1],
    progress: 0,
    files: [] as File[],
  });
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [comments, setComments] = useState<{ [projectId: number]: { name: string; text: string; date: string }[] }>({});
  const [commentText, setCommentText] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filtered projects
  let filteredProjects = projects;
  if (isIncubator) {
    filteredProjects = projects.filter(p => p.incubatorId === teamId);
  } else if (isMentor) {
    filteredProjects = projects.filter(p => mentorTeams.includes(p.incubatorId));
  }
  // Search filter
  filteredProjects = filteredProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );
  // Category filter
  if (categoryFilter !== "All") {
    filteredProjects = filteredProjects.filter(p => p.category === categoryFilter);
  }
  // Status filter
  if (statusFilter !== "All") {
    filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
  }

  // Add/Edit modal
  const openModal = (idx: number | null = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      const p = filteredProjects[idx];
      setForm({
        name: p.name,
        description: p.description,
        category: p.category,
        status: p.status,
        progress: p.progress || 0,
        files: p.files || [],
      });
    } else {
      setForm({ name: "", description: "", category: categories[1], status: statusOptions[1], progress: 0, files: [] });
    }
    setShowModal(true);
  };

  // Save add/edit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    if (editIdx !== null) {
      const projId = filteredProjects[editIdx].id;
      setProjects(prev => prev.map(p => p.id === projId ? {
        ...p,
        ...form,
        incubatorId: teamId,
      } : p));
    } else {
      setProjects(prev => [
        ...prev,
        {
          id: Math.max(0, ...prev.map(p => p.id)) + 1,
          ...form,
          incubatorId: teamId,
        },
      ]);
    }
    setShowModal(false);
    setEditIdx(null);
    setForm({ name: "", description: "", category: categories[1], status: statusOptions[1], progress: 0, files: [] });
  };

  // Update progress (incubator only)
  const handleProgress = (idx: number, value: number) => {
    const projId = filteredProjects[idx].id;
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, progress: value } : p));
  };

  // Handle file upload (real)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setForm(f => ({ ...f, files: [...f.files, ...Array.from(e.target.files)] }));
  };
  const handleRemoveFile = (file: File) => {
    setForm(f => ({ ...f, files: f.files.filter((fObj: File) => fObj !== file) }));
  };

  // Comments
  const handleAddComment = (projectId: number) => {
    if (!commentText.trim()) return;
    setComments(prev => ({
      ...prev,
      [projectId]: [
        { name: user.name, text: commentText, date: new Date().toLocaleString() },
        ...(prev[projectId] || []),
      ],
    }));
    setCommentText("");
  };

  // Table columns: Project Name, Team, Category, Status, Progress, Actions
  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Projects</h1>
            <div className="text-white opacity-90 mb-2">Manage and track team projects and progress.</div>
          </div>
          {isIncubator && (
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              onClick={() => openModal(null)}
            >
              + Add Project
            </button>
          )}
        </div>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Project List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-900">Project Name</th>
                  <th className="px-4 py-2 text-left text-blue-900">Team</th>
                  <th className="px-4 py-2 text-left text-blue-900">Category</th>
                  <th className="px-4 py-2 text-left text-blue-900">Status</th>
                  <th className="px-4 py-2 text-left text-blue-900">Progress</th>
                  <th className="px-4 py-2 text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-blue-400">No projects found.</td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const team = incubators.find(t => t.id === p.incubatorId);
                    return (
                      <tr key={p.id} className="border-b hover:bg-blue-50 transition">
                        <td className="px-4 py-2 text-blue-900 font-semibold">{p.name}</td>
                        <td className="px-4 py-2 text-blue-900">{team ? team.teamName : "-"}</td>
                        <td className="px-4 py-2 text-blue-900">{p.category}</td>
                        <td className="px-4 py-2 text-blue-900">{p.status}</td>
                        <td className="px-4 py-2 text-blue-900">
                          {isIncubator ? (
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={p.progress || 0}
                              onChange={e => handleProgress(idx, Number(e.target.value))}
                              className="w-32"
                            />
                          ) : (
                            <span>{p.progress || 0}%</span>
                          )}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            onClick={() => setViewIdx(idx)}
                          >View</button>
                          {isIncubator && (
                            <button
                              className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              onClick={() => openModal(idx)}
                            >Edit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Add/Edit Modal */}
        <Modal
          title={editIdx !== null ? "Edit Project" : "Add Project"}
          open={showModal}
          onClose={() => { setShowModal(false); setEditIdx(null); }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Project Name</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Category</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Status</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {statusOptions.slice(1).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Progress (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
              />
            </div>
            {/* File upload (real) */}
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Files (images, pdf, doc, etc.)</label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                onChange={handleFileUpload}
              />
              {form.files.length > 0 && (
                <ul className="list-disc ml-6 text-blue-900 mt-2">
                  {form.files.map((f: File | string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      {typeof f === "object" && "type" in f && f.type.startsWith("image/") ? (
                        <img src={getFileUrl(f as File)} alt={typeof f === "object" && "name" in f ? f.name : "file"} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <span className="inline-block w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xl">📄</span>
                      )}
                      <span>{typeof f === "object" && "name" in f ? f.name : String(f)}</span>
                      <Button
                        variant="icon"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => handleRemoveFile(f)}
                        type="button"
                        aria-label="Remove file"
                      >Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditIdx(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </Modal>
        {/* View Details Modal */}
        <Modal
          title={viewIdx !== null ? `Project Details: ${filteredProjects[viewIdx].name}` : "Project Details"}
          open={viewIdx !== null}
          onClose={() => setViewIdx(null)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {viewIdx !== null && (
            <>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Team:</div>
                <div className="text-blue-900">{incubators.find(t => t.id === filteredProjects[viewIdx].incubatorId)?.teamName || "-"}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Description:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].description}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Category:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].category}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Status:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].status}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Progress:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].progress || 0}%</div>
              </div>
              {/* Files */}
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Files:</div>
                {filteredProjects[viewIdx].files && filteredProjects[viewIdx].files.length > 0 ? (
                  <ul className="list-disc ml-6 text-blue-900">
                    {filteredProjects[viewIdx].files.map((f: File | string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        {typeof f === "object" && "type" in f && f.type.startsWith("image/") ? (
                          <a href={getFileUrl(f as File)} target="_blank" rel="noopener noreferrer">
                            <img src={getFileUrl(f as File)} alt={typeof f === "object" && "name" in f ? f.name : "file"} className="w-16 h-16 object-cover rounded shadow" />
                          </a>
                        ) : (
                          <a
                            href={typeof f === "object" && "type" in f ? getFileUrl(f as File) : undefined}
                            download={typeof f === "object" && "name" in f ? f.name : undefined}
                            className="text-blue-700 underline flex items-center gap-1"
                          >
                            <span className="inline-block w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xl">📄</span>
                            {typeof f === "object" && "name" in f ? f.name : String(f)}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-blue-400">No files uploaded.</div>
                )}
              </div>
              {/* Comments */}
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Comments:</div>
                <div className="mb-2">
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <Button
                    className="mt-2"
                    type="button"
                    onClick={() => handleAddComment(filteredProjects[viewIdx].id)}
                  >Post</Button>
                </div>
                {comments[filteredProjects[viewIdx].id] && comments[filteredProjects[viewIdx].id].length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {comments[filteredProjects[viewIdx].id].map((c, i) => (
                      <li key={i} className="border-b pb-1">
                        <span className="font-semibold text-blue-900">{c.name}</span> <span className="text-xs text-blue-500">{c.date}</span>
                        <div className="text-blue-800">{c.text}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-blue-400">No comments yet.</div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" type="button" onClick={() => setViewIdx(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Projects; 