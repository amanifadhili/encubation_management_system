import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { incubators, tools, projects } from "../mock/sampleData";
import { useToast } from "../components/Layout";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reports = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const isManager = user?.role === "manager";
  const isIncubator = user?.role === "incubator";
  const teamId = isIncubator ? (user as any).teamId : null;

  // Filters
  const [teamFilter, setTeamFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewIdx, setViewIdx] = useState<number | null>(null);

  // Unique categories for filter
  const categories = Array.from(new Set(projects.map(p => p.category)));

  // Filtered teams
  let filteredTeams = incubators;
  if (isIncubator) {
    filteredTeams = incubators.filter(t => t.id === teamId);
  } else {
    if (teamFilter !== "all") filteredTeams = filteredTeams.filter(t => t.id === Number(teamFilter));
  }

  // Helper: get assigned inventory for a team
  const getAssignedInventory = (teamId: number) =>
    tools.filter(tool => tool.assigned.some((a: any) => a.teamId === teamId));
  // Helper: get projects for a team
  const getTeamProjects = (teamId: number) =>
    projects.filter(p => p.incubatorId === teamId);

  // Item filter
  let teamsByItem = filteredTeams;
  if (itemFilter !== "all") {
    teamsByItem = teamsByItem.filter(team =>
      tools.find(tool => tool.id === Number(itemFilter) && tool.assigned.some((a: any) => a.teamId === team.id))
    );
  }
  // Category filter
  let teamsByCategory = teamsByItem;
  if (categoryFilter !== "all") {
    teamsByCategory = teamsByItem.filter(team =>
      getTeamProjects(team.id).some(p => p.category === categoryFilter)
    );
  }

  // Export as PDF (real)
  const handleExport = () => {
    const doc = new jsPDF();
    const tableColumn = ["Team Name", "Assigned Inventory", "Projects", "Category"];
    const tableRows = teamsByCategory.map(team => {
      const assignedInventory = getAssignedInventory(team.id);
      const teamProjects = getTeamProjects(team.id);
      const projectNames = teamProjects.map(p => p.name).join(", ");
      const category = teamProjects[0]?.category || "-";
      return [team.teamName, assignedInventory.length, projectNames, category];
    });
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save("team-report.pdf");
    showToast("PDF exported!", "success");
  };

  // Table data
  const tableTeams = teamsByCategory;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports & PDF Export</h1>
            <div className="text-white opacity-90 mb-2">View team assignments, inventory, and projects. Export as PDF.</div>
          </div>
          <button
            className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
            onClick={handleExport}
          >
            Export as PDF
          </button>
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Team</label>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              disabled={isIncubator}
            >
              <option value="all">All</option>
              {incubators.map(t => (
                <option key={t.id} value={t.id}>{t.teamName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Inventory Item</label>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={itemFilter}
              onChange={e => setItemFilter(e.target.value)}
            >
              <option value="all">All</option>
              {tools.map(tool => (
                <option key={tool.id} value={tool.id}>{tool.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Project Category</label>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Team Assignments & Projects</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-900">Team Name</th>
                  <th className="px-4 py-2 text-left text-blue-900">Assigned Inventory</th>
                  <th className="px-4 py-2 text-left text-blue-900">Projects</th>
                  <th className="px-4 py-2 text-left text-blue-900">Category</th>
                  <th className="px-4 py-2 text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableTeams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-blue-400">No data found. Try adjusting your filters.</td>
                  </tr>
                ) : (
                  tableTeams.map((team, idx) => {
                    const assignedInventory = getAssignedInventory(team.id);
                    const teamProjects = getTeamProjects(team.id);
                    const projectNames = teamProjects.map(p => p.name).join(", ");
                    const category = teamProjects[0]?.category || "-";
                    return (
                      <tr key={team.id} className="border-b hover:bg-blue-50 transition">
                        <td className="px-4 py-2 text-blue-900 font-semibold">{team.teamName}</td>
                        <td className="px-4 py-2 text-blue-900">{assignedInventory.length}</td>
                        <td className="px-4 py-2 text-blue-900">{projectNames || <span className="text-blue-400">No projects</span>}</td>
                        <td className="px-4 py-2 text-blue-900">{category}</td>
                        <td className="px-4 py-2">
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            onClick={() => setViewIdx(idx)}
                          >View Details</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* View Details Modal */}
        {viewIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
              <h2 className="text-lg font-bold mb-4 text-blue-900">Team Details: {tableTeams[viewIdx].teamName}</h2>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Team Members:</div>
                <ul className="list-disc ml-6 text-blue-900">
                  {tableTeams[viewIdx].members.map((m: any, i: number) => (
                    <li key={i}>{m.name} ({m.role}) - {m.email}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Assigned Inventory:</div>
                {getAssignedInventory(tableTeams[viewIdx].id).length === 0 ? (
                  <div className="text-blue-400">No inventory assigned.</div>
                ) : (
                  <ul className="list-disc ml-6 text-blue-900">
                    {getAssignedInventory(tableTeams[viewIdx].id).map((tool: any) => {
                      const assignment = tool.assigned.find((a: any) => a.teamId === tableTeams[viewIdx].id);
                      return (
                        <li key={tool.id}>{tool.name} (Qty: {assignment.quantity})</li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Projects:</div>
                {getTeamProjects(tableTeams[viewIdx].id).length === 0 ? (
                  <div className="text-blue-400">No projects.</div>
                ) : (
                  <ul className="list-disc ml-6 text-blue-900">
                    {getTeamProjects(tableTeams[viewIdx].id).map((p: any) => (
                      <li key={p.id}>{p.name} <span className="text-xs text-blue-500">[{p.category}]</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  className="px-4 py-2 bg-gray-200 text-blue-700 rounded font-semibold hover:bg-gray-300"
                  onClick={() => setViewIdx(null)}
                  type="button"
                >Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 