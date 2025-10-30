import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import Modal from "../components/Modal";
import Button from "../components/Button";
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
  getIncubators
} from "../services/api";
import socketService from "../services/socket";

const Notifications = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const isManager = user?.role === "manager";
  const isIncubator = user?.role === "incubator";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRecipient, setAddRecipient] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [teams, setTeams] = useState<any[]>([]);

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
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read_status: !n.read_status } : n
      ));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'updating notification');
    }
  };

  // Delete (only for sender/manager)
  const handleDelete = (notificationId: number) => {
    setDeleteIdx(notificationId);
  };
  const confirmDelete = async () => {
    if (deleteIdx === null) return;
    try {
      await deleteNotification(deleteIdx);
      setNotifications(prev => prev.filter(n => n.id !== deleteIdx));
      setDeleteIdx(null);
      showToast('Notification deleted successfully', 'success');
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting notification');
    }
  };
  const cancelDelete = () => setDeleteIdx(null);

  // Edit (only for sender/manager) - Note: Backend might not support editing
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditMessage(notifications[idx].message);
  };
  const confirmEdit = () => {
    // For now, just update locally since backend might not support editing
    if (editIdx === null) return;
    setNotifications(prev => prev.map((n, i) => i === editIdx ? { ...n, message: editMessage } : n));
    setEditIdx(null);
    setEditMessage("");
  };
  const cancelEdit = () => {
    setEditIdx(null);
    setEditMessage("");
  };

  // Add notification (manager only, to teams only)
  const handleAddNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRecipient || !addMessage) return;

    try {
      const result = await createNotification({
        title: "Notification", // Backend expects title
        message: addMessage,
        recipient_type: "team",
        recipient_id: parseInt(addRecipient)
      });

      setNotifications(prev => [result, ...prev]);
      setShowAddModal(false);
      setAddRecipient("");
      setAddMessage("");
      showToast('Notification sent successfully', 'success');
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'creating notification');
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
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              onClick={() => setShowAddModal(true)}
            >
              + Add Notification
            </button>
          )}
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-blue-400 py-12">Loading notifications...</div>
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
                      <button
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                        onClick={() => toggleRead(n.id)}
                      >{n.read_status ? "Mark as Unread" : "Mark as Read"}</button>
                    )}
                    {isManager && (
                      <>
                        <button
                          className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                          onClick={() => handleEdit(idx)}
                        >Edit</button>
                        <button
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                          onClick={() => handleDelete(n.id)}
                        >Delete</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-500">
                  {isManager ? (
                    <span>To: <span className="font-semibold">Team {n.recipient_id}</span></span>
                  ) : (
                    <span>From: <span className="font-semibold">Manager {n.sender_id}</span></span>
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
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Send
              </Button>
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
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmEdit}>
              Save
            </Button>
          </div>
        </Modal>
        {/* Delete Confirmation Modal */}
        <Modal
          title="Delete Notification"
          open={deleteIdx !== null}
          onClose={cancelDelete}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {deleteIdx !== null && (
            <>
              <div className="mb-6 text-blue-900">Are you sure you want to delete this notification? This action cannot be undone.</div>
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

export default Notifications; 