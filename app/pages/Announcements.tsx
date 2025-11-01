import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api";

const Announcements = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const canPost = user && (user.role === "manager" || user.role === "director");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  // Loading states for individual actions
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load announcements on mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await withRetry(() => getAnnouncements(), {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          showToast(`Retrying... (${attempt}/3)`, "info", { duration: 2000 });
        },
      });
      setAnnouncements(data);
    } catch (error: any) {
      console.error("Failed to load announcements:", error);
      const errorDetails = ErrorHandler.parse(error);

      if (ErrorHandler.isTimeout(error)) {
        showToast("Request timed out. Please try again.", "error");
      } else {
        showToast(
          errorDetails.userMessage || "Failed to load announcements",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Open add/edit modal
  const openModal = (idx: number | null = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      setForm({
        title: announcements[idx].title,
        content: announcements[idx].content,
      });
    } else {
      setForm({ title: "", content: "" });
    }
    setShowModal(true);
  };

  // Save add/edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !user) return;

    setSaving(true);
    try {
      if (editIdx !== null) {
        const announcementId = announcements[editIdx].id;
        await updateAnnouncement(announcementId, {
          title: form.title,
          content: form.content,
        });
        setAnnouncements((prev) =>
          prev.map((a, i) =>
            i === editIdx
              ? { ...a, title: form.title, content: form.content }
              : a
          )
        );
      } else {
        const result = await createAnnouncement({
          title: form.title,
          content: form.content,
        });
        setAnnouncements((prev) => [result, ...prev]);
      }
      setShowModal(false);
      setEditIdx(null);
      setForm({ title: "", content: "" });
      showToast(
        editIdx !== null
          ? "Announcement updated successfully"
          : "Announcement posted successfully",
        "success"
      );
    } catch (error: any) {
      console.error("Failed to save announcement:", error);
      ErrorHandler.handleError(error, showToast, "saving announcement");
    } finally {
      setSaving(false);
    }
  };

  // Delete announcement (with confirmation)
  const handleDelete = (idx: number) => {
    setDeleteIdx(idx);
  };
  const confirmDelete = async () => {
    if (deleteIdx === null) return;

    setDeleting(true);
    try {
      const announcementId = announcements[deleteIdx].id;
      await deleteAnnouncement(announcementId);
      setAnnouncements((prev) => prev.filter((_, i) => i !== deleteIdx));
      setDeleteIdx(null);
      showToast("Announcement deleted successfully", "success");
    } catch (error: any) {
      console.error("Failed to delete announcement:", error);
      ErrorHandler.handleError(error, showToast, "deleting announcement");
    } finally {
      setDeleting(false);
    }
  };
  const cancelDelete = () => setDeleteIdx(null);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Announcement Board
            </h1>
            <div className="text-gray-700 dark:text-white opacity-90 mb-2">
              View and post important announcements.
            </div>
          </div>
          {canPost && (
            <ButtonLoader
              onClick={() => openModal(null)}
              loading={false}
              label="+ Post Announcement"
              variant="primary"
              size="md"
            />
          )}
        </div>
        <div className="space-y-6">
          {loading ? (
            <PageSkeleton count={3} layout="card" />
          ) : announcements.length === 0 ? (
            <div className="text-center text-blue-400 py-12">
              No announcements yet.
            </div>
          ) : (
            announcements.map((a: any, idx: number) => (
              <div
                key={a.id}
                className="bg-white rounded shadow p-4 flex flex-col gap-2 relative"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-blue-900">{a.title}</h2>
                  {canPost && (
                    <div className="flex gap-2">
                      <ButtonLoader
                        onClick={() => openModal(idx)}
                        loading={false}
                        label="Edit"
                        variant="success"
                        size="sm"
                      />
                      <ButtonLoader
                        onClick={() => handleDelete(idx)}
                        loading={false}
                        label="Delete"
                        variant="danger"
                        size="sm"
                      />
                    </div>
                  )}
                </div>
                <div className="text-blue-800 mb-2">{a.content}</div>
                <div className="flex items-center gap-4 text-xs text-blue-500">
                  <span>
                    Posted by:{" "}
                    <span className="font-semibold">
                      {a.author?.name || "System"}
                    </span>
                  </span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Add/Edit Modal */}
        <Modal
          title={editIdx !== null ? "Edit Announcement" : "Post Announcement"}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditIdx(null);
          }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Title
              </label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Content
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                rows={5}
                required
                disabled={saving}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditIdx(null);
                }}
                loading={false}
                label="Cancel"
              />
              <ButtonLoader
                type="submit"
                loading={saving}
                label={editIdx !== null ? "Update" : "Post"}
                loadingText={editIdx !== null ? "Updating..." : "Posting..."}
                variant="primary"
              />
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
              <div className="mb-6 text-blue-900">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {announcements[deleteIdx].title}
                </span>
                ? This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <ButtonLoader
                  variant="secondary"
                  type="button"
                  onClick={cancelDelete}
                  loading={false}
                  label="Cancel"
                />
                <ButtonLoader
                  variant="danger"
                  type="button"
                  onClick={confirmDelete}
                  loading={deleting}
                  label="Delete"
                  loadingText="Deleting..."
                />
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Announcements;
