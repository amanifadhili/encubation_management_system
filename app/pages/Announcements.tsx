import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { announcements as mockAnnouncements } from "../mock/sampleData";
import Modal from "../components/Modal";
import Button from "../components/Button";

const Announcements = () => {
  const { user } = useAuth();
  const canPost = user && (user.role === "manager" || user.role === "director");
  const [announcements, setAnnouncements] = useState(mockAnnouncements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  // Open add/edit modal
  const openModal = (idx: number | null = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      setForm({ title: announcements[idx].title, content: announcements[idx].content });
    } else {
      setForm({ title: "", content: "" });
    }
    setShowModal(true);
  };

  // Save add/edit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    const now = new Date().toISOString().slice(0, 10);
    if (editIdx !== null) {
      setAnnouncements(prev => prev.map((a, i) => i === editIdx ? { ...a, title: form.title, content: form.content, date: now, postedBy: user.name } : a));
    } else {
      setAnnouncements(prev => [
        {
          id: Math.max(0, ...prev.map(a => a.id)) + 1,
          title: form.title,
          content: form.content,
          date: now,
          postedBy: user.name,
        },
        ...prev,
      ]);
    }
    setShowModal(false);
    setEditIdx(null);
    setForm({ title: "", content: "" });
  };

  // Delete announcement (with confirmation)
  const handleDelete = (idx: number) => {
    setDeleteIdx(idx);
  };
  const confirmDelete = () => {
    if (deleteIdx === null) return;
    setAnnouncements(prev => prev.filter((_, i) => i !== deleteIdx));
    setDeleteIdx(null);
  };
  const cancelDelete = () => setDeleteIdx(null);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Announcement Board</h1>
            <div className="text-white opacity-90 mb-2">View and post important announcements.</div>
          </div>
          {canPost && (
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              onClick={() => openModal(null)}
            >
              + Post Announcement
            </button>
          )}
        </div>
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="text-center text-blue-400 py-12">No announcements yet.</div>
          ) : (
            announcements.map((a, idx) => (
              <div key={a.id} className="bg-white rounded shadow p-4 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-blue-900">{a.title}</h2>
                  {(canPost && a.postedBy === user.name) && (
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        onClick={() => openModal(idx)}
                      >Edit</button>
                      <button
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        onClick={() => handleDelete(idx)}
                      >Delete</button>
                    </div>
                  )}
                </div>
                <div className="text-blue-800 mb-2">{a.content}</div>
                <div className="flex items-center gap-4 text-xs text-blue-500">
                  <span>Posted by: <span className="font-semibold">{a.postedBy}</span></span>
                  <span>{a.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Add/Edit Modal */}
        <Modal
          title={editIdx !== null ? "Edit Announcement" : "Post Announcement"}
          open={showModal}
          onClose={() => { setShowModal(false); setEditIdx(null); }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Title</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Content</label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
                required
              />
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
        {/* Delete Confirmation Modal */}
        <Modal
          title="Delete Announcement"
          open={deleteIdx !== null}
          onClose={cancelDelete}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {deleteIdx !== null && (
            <>
              <div className="mb-6 text-blue-900">Are you sure you want to delete <span className="font-semibold">{announcements[deleteIdx].title}</span>? This action cannot be undone.</div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" type="button" onClick={cancelDelete}>
                  Cancel
                </Button>
                <Button variant="danger" type="button" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Announcements; 