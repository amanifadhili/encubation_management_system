import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";

const ManageTeam = () => {
  const { user } = useAuth();
  const showToast = useToast();
  if (!user || user.role !== "incubator") return <div className="text-red-600 font-semibold">Access denied.</div>;
  const teamId = (user as any).teamId;
  const [members, setMembers] = useState<any[]>([]);
  const [teamLeaderEmail, setTeamLeaderEmail] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", role: "Member" });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "Member" });
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Loading states for individual actions
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add member modal logic
  const handleAddMember = () => {
    if (!addForm.name || !addForm.email) {
      showToast("Please enter name and email.", "error");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      setMembers(prev => [...prev, { name: addForm.name, email: addForm.email, role: "Member" }]);
      setAddForm({ name: "", email: "", role: "Member" });
      setShowAddModal(false);
      setAdding(false);
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
    setEditing(true);
    setTimeout(() => {
      setMembers(prev => prev.map((m, i) => i === idx ? { name: editForm.name, email: editForm.email, role: "Member" } : m));
      setEditIdx(null);
      setEditForm({ name: "", email: "", role: "Member" });
      setEditing(false);
      showToast("Member updated!", "success");
    }, 600);
  };

  // Remove member with confirmation
  const confirmRemove = (idx: number) => setRemovingIdx(idx);
  const handleRemoveMember = (idx: number) => {
    setRemoving(true);
    setTimeout(() => {
      setMembers(prev => prev.filter((_, i) => i !== idx));
      setRemovingIdx(null);
      setRemoving(false);
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
    setSaving(true);
    setTimeout(() => {
      showToast("Team changes saved! (mock)", "success");
      setSaving(false);
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
            <div className="font-semibold text-blue-800">Team ID:</div>
            <div className="text-lg font-bold text-blue-900">{teamId}</div>
            <div className="mt-2 text-blue-700"><span className="font-semibold">Role:</span> Incubator</div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">Current Team Leader:</div>
            <div className="text-blue-900">{teamLeaderEmail ? members.find((m: any) => m.email === teamLeaderEmail)?.name || teamLeaderEmail : <span className="italic text-blue-400">Not assigned yet.</span>}</div>
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
                            disabled={editing}
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
                            disabled={editing}
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
                          disabled={editing || adding || removing || saving}
                          title={teamLeaderEmail === m.email ? "Current Team Leader" : "Set as Team Leader"}
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-2 flex gap-2">
                        {editIdx === idx ? (
                          <>
                            <ButtonLoader
                              variant="primary"
                              onClick={() => saveEdit(idx)}
                              loading={editing}
                              label="Save"
                              loadingText="Saving..."
                              size="sm"
                            />
                            <ButtonLoader
                              variant="secondary"
                              onClick={cancelEdit}
                              loading={false}
                              label="Cancel"
                              size="sm"
                            />
                          </>
                        ) : (
                          <>
                            <ButtonLoader
                              variant="outline"
                              onClick={() => startEdit(idx)}
                              loading={false}
                              label="Edit"
                              size="sm"
                              disabled={editing || adding || removing || saving}
                            />
                            <ButtonLoader
                              variant="danger"
                              onClick={() => confirmRemove(idx)}
                              loading={false}
                              label="Remove"
                              size="sm"
                              disabled={editing || adding || removing || saving}
                            />
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
                disabled={adding}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Email</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                disabled={adding}
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
                type="button"
                onClick={handleAddMember}
                loading={adding}
                label="Add Member"
                loadingText="Adding..."
                variant="primary"
              />
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
                  <ButtonLoader
                    variant="secondary"
                    type="button"
                    onClick={() => setRemovingIdx(null)}
                    loading={false}
                    label="Cancel"
                  />
                  <ButtonLoader
                    variant="danger"
                    type="button"
                    onClick={() => handleRemoveMember(removingIdx)}
                    loading={removing}
                    label="Remove"
                    loadingText="Removing..."
                  />
                </div>
              </>
            )}
          </Modal>
          {/* Add member button */}
          <div className="mt-6 flex justify-end gap-4">
            <ButtonLoader
              onClick={() => setShowAddModal(true)}
              loading={false}
              label="+ Add Member"
              variant="primary"
              disabled={editing || adding || removing || saving}
            />
            <ButtonLoader
              onClick={handleSave}
              loading={saving}
              label="Save Changes"
              loadingText="Saving..."
              variant="success"
              disabled={editing || adding || removing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTeam; 