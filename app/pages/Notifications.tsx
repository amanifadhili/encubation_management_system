import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import {
  getNotifications,
  createNotification,
  updateNotification,
  markNotificationAsRead,
  deleteNotification,
  getIncubators
} from "../services/api";
import socketService from "../services/socket";

const Notifications = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const isManager = user?.role === "manager" || user?.role === "director";
  const isIncubator = user?.role === "incubator";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRecipient, setAddRecipient] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  
  // Loading states for individual actions
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);

  // Load notifications and teams on mount
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadTeams();
      setupSocket();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      // For managers, getNotifications returns sent notifications
      // For incubators, getNotifications returns received notifications
      setNotifications(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await getIncubators();
      setTeams(data.map((team: any) => ({ id: team.id, teamName: team.team_name })));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading teams');
      setTeams([]);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);

      // Listen for new notifications
      const handleNewNotification = (event: any) => {
        const { data } = event.detail;
        setNotifications(prev => [data, ...prev]);
      };

      window.addEventListener('socket:notification_received', handleNewNotification);

      return () => {
        window.removeEventListener('socket:notification_received', handleNewNotification);
        socketService.disconnect();
      };
    }
  };

  // Mark as read/unread (only for teams)
  const toggleRead = async (notificationId: number) => {
    if (!isIncubator) return;
    setMarkingRead(notificationId);
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read_status: !n.read_status } : n
      ));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'updating notification');
    } finally {
      setMarkingRead(null);
    }
  };

  // Delete (only for sender/manager)
  const handleDelete = (notificationId: number) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      setNotificationToDelete(notification);
      setDeleteIdx(notificationId);
      setDeleteModalOpen(true);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (deleteIdx === null || !notificationToDelete) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteIdx);
      setNotifications(prev => prev.filter(n => n.id !== deleteIdx));
      setDeleteModalOpen(false);
      setDeleteIdx(null);
      setNotificationToDelete(null);
      showToast('Notification deleted successfully', 'success');
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting notification');
      // Don't close modal on error so user can retry
    } finally {
      setDeleting(false);
    }
  };

  // Edit (only for sender/manager)
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditMessage(notifications[idx].message);
  };
  const confirmEdit = async () => {
    if (editIdx === null) return;
    setEditing(true);
    try {
      const notificationId = notifications[editIdx].id;
      await updateNotification(notificationId, { message: editMessage });
      setNotifications(prev => prev.map((n, i) => i === editIdx ? { ...n, message: editMessage } : n));
      setEditIdx(null);
      setEditMessage("");
      showToast('Notification updated successfully', 'success');
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'updating notification');
    } finally {
      setEditing(false);
    }
  };
  const cancelEdit = () => {
    setEditIdx(null);
    setEditMessage("");
  };

  // Add notification (manager only, to teams only)
  const handleAddNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRecipient || !addMessage) return;

    setSending(true);
    try {
      const result = await createNotification({
        title: "Notification", // Backend expects title
        message: addMessage,
        recipient_type: "team",
        recipient_id: addRecipient
      });

      // Add the new notification to the list (but only if user is manager, since managers see sent notifications)
      if (isManager) {
        setNotifications(prev => [result.data?.notification || result, ...prev]);
      }
      setShowAddModal(false);
      setAddRecipient("");
      setAddMessage("");
      showToast('Notification sent successfully', 'success');
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'creating notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Notification Center</h1>
            <div className="text-white opacity-90 mb-2">{isManager ? "View, create, edit, and delete notifications you sent to teams." : isIncubator ? "View and manage notifications sent to your team." : "No notifications available."}</div>
          </div>
          {isManager && (
            <ButtonLoader
              onClick={() => setShowAddModal(true)}
              loading={false}
              label="+ Add Notification"
              variant="primary"
              size="md"
            />
          )}
        </div>
        <div className="space-y-4">
          {loading ? (
            <PageSkeleton count={5} layout="list" />
          ) : notifications.length === 0 ? (
            <div className="text-center text-blue-400 py-12">No notifications.</div>
          ) : (
            notifications.map((n, idx) => (
              <div key={n.id} className={`bg-white rounded shadow p-4 flex flex-col gap-2 relative border-l-4 ${n.read_status ? 'border-blue-200' : 'border-blue-600'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!n.read_status && isIncubator && <span className="w-2 h-2 bg-blue-600 rounded-full" title="Unread" />}
                    <span className="font-semibold text-blue-900">{n.title}: {n.message}</span>
                  </div>
                  <div className="flex gap-2">
                    {isIncubator && (
                      <ButtonLoader
                        onClick={() => toggleRead(n.id)}
                        loading={markingRead === n.id}
                        label={n.read_status ? "Mark as Unread" : "Mark as Read"}
                        loadingText="Updating..."
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      />
                    )}
                    {isManager && (
                      <>
                        <ButtonLoader
                          onClick={() => handleEdit(idx)}
                          loading={false}
                          label="Edit"
                          variant="success"
                          size="sm"
                          className="text-xs"
                        />
                        <ButtonLoader
                          onClick={() => handleDelete(n.id)}
                          loading={false}
                          label="Delete"
                          variant="danger"
                          size="sm"
                          className="text-xs"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-500">
                  {isManager ? (
                    <span>To: <span className="font-semibold">{teams.find(t => t.id === n.recipient_id)?.teamName || `Team ${n.recipient_id}`}</span></span>
                  ) : (
                    <span>From: <span className="font-semibold">{n.sender?.name || 'Manager'}</span></span>
                  )}
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Add Notification Modal */}
        <Modal
          title="Add Notification"
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleAddNotification}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Recipient (Team)</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addRecipient}
                onChange={e => setAddRecipient(e.target.value)}
                required
                disabled={sending}
              >
                <option value="">Select team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.teamName}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Message</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addMessage}
                onChange={e => setAddMessage(e.target.value)}
                required
                disabled={sending}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                variant="secondary"
                type="button"
                onClick={() => setShowAddModal(false)}
                loading={false}
                label="Cancel"
              />
              <ButtonLoader
                type="submit"
                loading={sending}
                label="Send"
                loadingText="Sending..."
                variant="primary"
              />
            </div>
          </form>
        </Modal>
        {/* Edit Modal */}
        <Modal
          title="Edit Notification"
          open={editIdx !== null}
          onClose={cancelEdit}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Message</label>
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
              required
              disabled={editing}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={cancelEdit}
              loading={false}
              label="Cancel"
            />
            <ButtonLoader
              type="button"
              onClick={confirmEdit}
              loading={editing}
              label="Save"
              loadingText="Saving..."
              variant="primary"
            />
          </div>
        </Modal>
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteIdx(null);
            setNotificationToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={notificationToDelete?.title || notificationToDelete?.message?.substring(0, 50)}
          itemType="notification"
          loading={deleting}
          description="This will permanently delete this notification. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default Notifications; 