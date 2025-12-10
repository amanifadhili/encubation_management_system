import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  getIncubator,
  getIncubatorMembers,
  addIncubatorMember,
  removeIncubatorMember,
} from "../services/api";

const ManageTeam = () => {
  const { user } = useAuth();
  const showToast = useToast();
  if (!user || user.role !== "incubator")
    return <div className="text-red-600 font-semibold">Access denied.</div>;
  // teamId comes from /auth/me; keep it as string (API expects string IDs)
  const teamId = (user as any).teamId as string | undefined;
  const hasTeam = Boolean(teamId);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teamLeaderEmail, setTeamLeaderEmail] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "Member",
  });
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    loadTeam();
  }, [teamId]);

  const normalizeMembers = (items: any[]) =>
    items.map((m: any) => ({
      id: m.user?.id || m.id,
      teamMemberId: m.id,
      name: m.user?.name || m.name,
      email: m.user?.email || m.email,
      role: m.role || "member",
    }));

  const loadTeam = async () => {
    if (!teamId) {
      setErrorMessage("Team not found");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage(null);

      const teamRes = await getIncubator(teamId);
      const teamData = teamRes?.data?.team || teamRes?.data || teamRes;
      setTeamName(teamData?.team_name || teamData?.teamName || teamId);

      const memberRes = await getIncubatorMembers(teamId);
      const rawMembers = memberRes?.data?.teamMembers || memberRes?.teamMembers || memberRes?.data || [];
      const normalized = normalizeMembers(rawMembers);
      setMembers(normalized);

      // Determine if current user is the team leader
      const isLeader = normalized.some(
        (m) =>
          (m.role || "").toLowerCase() === "team_leader" &&
          (m.email || "").toLowerCase() === (user?.email || "").toLowerCase()
      );
      setIsTeamLeader(isLeader);

      const leader = normalized.find((m) => (m.role || "").toLowerCase() === "team_leader");
      setTeamLeaderEmail(leader?.email || "");
    } catch (error: any) {
      console.error("Failed to load team", error);
      const msg = error.response?.data?.message || error.message || "Failed to load team data";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!teamId) {
      showToast("Team not found.", "error");
      return;
    }
    if (!isTeamLeader) {
      showToast("Only team leaders can add members.", "error");
      return;
    }
    if (!addForm.name || !addForm.email) {
      showToast("Please enter name and email.", "error");
      return;
    }
    setAdding(true);
    try {
      await addIncubatorMember(teamId, {
        name: addForm.name,
        email: addForm.email,
      });
      showToast("Member added!", "success");
      setAddForm({ name: "", email: "", role: "Member" });
      setShowAddModal(false);
      await loadTeam();
    } catch (error: any) {
      console.error("Failed to add member", error);
      showToast(
        error.response?.data?.message || "Failed to add member",
        "error"
      );
    } finally {
      setAdding(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (member: any) => {
    if (!teamId) {
      showToast("Team not found.", "error");
      return;
    }
    if (!isTeamLeader) {
      showToast("Only team leaders can remove members.", "error");
      return;
    }
    if (!member?.teamMemberId) {
      showToast("Missing member id; cannot remove.", "error");
      return;
    }
    try {
      setRemovingId(member.teamMemberId);
      await removeIncubatorMember(teamId, member.teamMemberId);
      showToast("Member removed!", "info");
      await loadTeam();
    } catch (error: any) {
      console.error("Failed to remove member", error);
      showToast(
        error.response?.data?.message || "Failed to remove member",
        "error"
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (!hasTeam) {
    return (
      <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white border border-red-200 rounded shadow p-4 text-red-700">
            <div className="font-semibold text-red-800">No team assigned</div>
            <div className="text-sm mt-1">
              Your account does not have a team linked yet. Please contact support or your manager to be assigned to a team.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Manage Team
          </h1>
          <div className="text-white opacity-90 mb-2">
            Add, edit, and manage your team members and leader.
          </div>
        </div>
        {!isTeamLeader && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2">
            Read-only: only team leaders can manage team membership.
          </div>
        )}
        {/* Team summary card */}
        <div className="mb-8 p-4 bg-white rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-semibold text-blue-800">Team ID:</div>
            <div className="text-lg font-bold text-blue-900">{teamId || "N/A"}</div>
            <div className="font-semibold text-blue-800 mt-2">Team Name:</div>
            <div className="text-lg font-bold text-blue-900">{teamName || "Loading..."}</div>
            <div className="mt-2 text-blue-700">
              <span className="font-semibold">Role:</span> Incubator
            </div>
          </div>
          <div>
            <div className="font-semibold text-blue-800">
              Current Team Leader:
            </div>
            <div className="text-blue-900">
              {teamLeaderEmail
                ? members.find((m: any) => m.email === teamLeaderEmail)?.name ||
                  teamLeaderEmail
                : "Not assigned yet."}
            </div>
          </div>
        </div>
        {errorMessage && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {errorMessage}
          </div>
        )}
        {loading && <PageSkeleton count={3} layout="card" />}
        {/* Members table */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            Team Members
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-900">Name</th>
                  <th className="px-4 py-2 text-left text-blue-900">Email</th>
                  <th className="px-4 py-2 text-left text-blue-900">
                    Team Leader
                  </th>
                  {isTeamLeader && (
                    <th className="px-4 py-2 text-left text-blue-900">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={isTeamLeader ? 4 : 3} className="text-center py-8 text-blue-400">
                      No members yet. Add your team members.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr
                      key={m.teamMemberId || m.email || idx}
                      className="border-b hover:bg-blue-50 transition"
                    >
                      <td className="px-4 py-2 text-blue-900">{m.name}</td>
                      <td className="px-4 py-2 text-blue-900">{m.email}</td>
                      <td className="px-4 py-2 text-center text-blue-900 font-semibold">
                        {((m.role || "").toLowerCase() === "team_leader")
                          ? "Team Leader"
                          : "Member"}
                      </td>
                      {isTeamLeader && (
                        <td className="px-4 py-2 flex gap-2">
                          <ButtonLoader
                            variant="danger"
                            onClick={() => handleRemoveMember(m)}
                            loading={removingId === m.teamMemberId}
                            label="Remove"
                            size="sm"
                            disabled={
                              removingId === m.teamMemberId ||
                              (m.role || "").toLowerCase() === "team_leader"
                            }
                          />
                        </td>
                      )}
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
              <label className="block mb-1 font-semibold text-blue-800">
                Name
              </label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                disabled={adding}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Email
              </label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
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
          {/* Add member button */}
          {isTeamLeader && (
            <div className="mt-6 flex justify-end gap-4">
              <ButtonLoader
                onClick={() => setShowAddModal(true)}
                loading={false}
                label="+ Add Member"
                variant="primary"
                disabled={adding || loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTeam;
