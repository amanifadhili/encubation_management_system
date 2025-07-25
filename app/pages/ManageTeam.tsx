import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { incubators as mockIncubators } from "../mock/sampleData";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";

const ManageTeam = () => {
  const { user } = useAuth();
  const showToast = useToast();
  if (!user || user.role !== "incubator") return <div className="text-red-600 font-semibold">Access denied.</div>;
  const teamId = (user as any).teamId;
  const team = mockIncubators.find(i => i.id === teamId);
  const [members, setMembers] = useState(team?.members || []);
  const [teamLeaderEmail, setTeamLeaderEmail] = useState(team?.teamLeader?.email || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", role: "Member" });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "Member" });
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Add member modal logic
  const handleAddMember = () => {
    if (!addForm.name || !addForm.email) {
      showToast("Please enter name and email.", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMembers(prev => [...prev, { name: addForm.name, email: addForm.email, role: "Member" }]);
      setAddForm({ name: "", email: "", role: "Member" });
      setShowAddModal(false);
      setLoading(false);
      showToast("Member added!", "success");
    }, 600);
  };

  // Edit member inline
  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditForm(members[idx]);
  };
  const cancelEdit = () => {
    setEditIdx(null);
    setEditForm({ name: "", email: "", role: "Member" });
  };
  const saveEdit = (idx: number) => {
    if (!editForm.name || !editForm.email) {
      showToast("Please enter name and email.", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMembers(prev => prev.map((m, i) => i === idx ? { name: editForm.name, email: editForm.email, role: "Member" } : m));
      setEditIdx(null);
      setEditForm({ name: "", email: "", role: "Member" });
      setLoading(false);
      showToast("Member updated!", "success");
    }, 600);
  };

  // Remove member with confirmation
  const confirmRemove = (idx: number) => setRemovingIdx(idx);
  const handleRemoveMember = (idx: number) => {
    setLoading(true);
    setTimeout(() => {
      setMembers(prev => prev.filter((_, i) => i !== idx));
      setRemovingIdx(null);
      setLoading(false);
      showToast("Member removed!", "info");
    }, 600);
  };

  // Set team leader
  const handleSetLeader = (email: string) => {
    setTeamLeaderEmail(email);
    showToast("Team Leader updated!", "success");
  };

  // Save all changes (mock)
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      showToast("Team changes saved! (mock)", "success");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Manage Team</h1>
          <div className="text-white opacity-90 mb-2">Add, edit, and manage your team members and leader.</div>
        </div>
        {/* Team summary card */}
        <div className="mb-8 p-4 bg-white rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-semibold text-blue-800">Team Name:</div>
            <div className="text-lg font-bold text-blue-900">{team?.teamName}</div>
            <div className="mt-2 text-blue-700"><span className="font-semibold">Credentials (Email):</span> {team?.credentials.email}</div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">Current Team Leader:</div>
            <div className="text-blue-900">{teamLeaderEmail ? members.find(m => m.email === teamLeaderEmail)?.name || teamLeaderEmail : <span className="italic text-blue-400">Not assigned yet.</span>}</div>
          </div>
        </div>
        {/* Members table */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Team Members</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-900">Name</th>
                  <th className="px-4 py-2 text-left text-blue-900">Email</th>
                  <th className="px-4 py-2 text-left text-blue-900">Team Leader</th>
                  <th className="px-4 py-2 text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-blue-400">No members yet. Add your team members.</td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr key={idx} className="border-b hover:bg-blue-50 transition">
                      {/* Name */}
                      <td className="px-4 py-2 text-blue-900">
                        {editIdx === idx ? (
                          <input
                            className="px-2 py-1 rounded border w-full"
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            disabled={loading}
                          />
                        ) : (
                          m.name
                        )}
                      </td>
                      {/* Email */}
                      <td className="px-4 py-2 text-blue-900">
                        {editIdx === idx ? (
                          <input
                            className="px-2 py-1 rounded border w-full"
                            value={editForm.email}
                            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                            disabled={loading}
                          />
                        ) : (
                          m.email
                        )}
                      </td>
                      {/* Team Leader radio */}
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name="teamLeader"
                          checked={teamLeaderEmail === m.email}
                          onChange={() => handleSetLeader(m.email)}
                          disabled={loading}
                          title={teamLeaderEmail === m.email ? "Current Team Leader" : "Set as Team Leader"}
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-2 flex gap-2">
                        {editIdx === idx ? (
                          <>
                            <button
                              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              onClick={() => saveEdit(idx)}
                              disabled={loading}
                            >
                              Save
                            </button>
                            <button
                              className="px-2 py-1 bg-gray-200 text-blue-700 rounded hover:bg-gray-300"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => startEdit(idx)}
                              disabled={loading}
                              title="Edit Member"
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              onClick={() => confirmRemove(idx)}
                              disabled={loading}
                              title="Remove Member"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Add member modal */}
          <Modal
            title="Add New Member"
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            actions={null}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Name</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Email</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddMember} disabled={loading}>
                Add Member
              </Button>
            </div>
          </Modal>
          {/* Remove confirmation dialog */}
          <Modal
            title="Remove Member"
            open={removingIdx !== null}
            onClose={() => setRemovingIdx(null)}
            actions={null}
            role="dialog"
            aria-modal="true"
          >
            {removingIdx !== null && (
              <>
                <div className="mb-4 text-blue-900">Are you sure you want to remove <span className="font-semibold">{members[removingIdx].name}</span> from your team?</div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" type="button" onClick={() => setRemovingIdx(null)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="danger" type="button" onClick={() => handleRemoveMember(removingIdx)} disabled={loading}>
                    Remove
                  </Button>
                </div>
              </>
            )}
          </Modal>
          {/* Add member button */}
          <div className="mt-6 flex justify-end">
            <Button
              className="px-6 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              + Add Member
            </Button>
            <Button
              className="ml-4 px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
              onClick={handleSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </div>
          {loading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10"><div className="bg-white p-4 rounded shadow text-blue-700 font-bold">Saving...</div></div>}
        </div>
      </div>
    </div>
  );
};

export default ManageTeam; 