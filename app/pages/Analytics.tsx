// This Analytics page is now used as the main Dashboard for all users. Do not link separately in the sidebar.
import React from "react";
import { incubators, projects, tools, requests, mentors, managers } from "../mock/sampleData";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useAuth } from "../context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Card = ({ title, value }: { title: string; value: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-4 flex-1 min-w-[180px]">
    <div className="text-lg font-semibold text-white opacity-90">{title}</div>
    <div className="text-3xl font-bold text-white mt-2">{value}</div>
  </div>
);

function getRoleFilteredData(user: any) {
  if (!user) return { teams: [], projects: [], inventory: [], requests: [] };
  if (user.role === "director") {
    return {
      teams: incubators,
      projects,
      inventory: tools,
      requests,
    };
  }
  if (user.role === "manager") {
    // Find manager's managed teams
    const manager = managers.find(m => m.name === user.name);
    const teamIds = manager?.teamsManaged || [];
    return {
      teams: incubators.filter(t => teamIds.includes(t.id)),
      projects: projects.filter(p => teamIds.includes(p.incubatorId)),
      inventory: tools.map(tool => ({
        ...tool,
        assigned: tool.assigned.filter(a => teamIds.includes(a.teamId)),
      })),
      requests: requests.filter(r => teamIds.includes(r.incubatorId)),
    };
  }
  if (user.role === "mentor") {
    // Find mentor's assigned teams
    const mentor = mentors.find(m => m.name === user.name);
    const teamIds = mentor?.assignedTeams || [];
    return {
      teams: incubators.filter(t => teamIds.includes(t.id)),
      projects: projects.filter(p => teamIds.includes(p.incubatorId)),
      inventory: tools.map(tool => ({
        ...tool,
        assigned: tool.assigned.filter(a => teamIds.includes(a.teamId)),
      })),
      requests: requests.filter(r => teamIds.includes(r.incubatorId)),
    };
  }
  if (user.role === "incubator") {
    const teamId = user.teamId;
    return {
      teams: incubators.filter(t => t.id === teamId),
      projects: projects.filter(p => p.incubatorId === teamId),
      inventory: tools.map(tool => ({
        ...tool,
        assigned: tool.assigned.filter(a => a.teamId === teamId),
      })),
      requests: requests.filter(r => r.incubatorId === teamId),
    };
  }
  return { teams: [], projects: [], inventory: [], requests: [] };
}

const Analytics = () => {
  const { user } = useAuth();
  const { teams, projects, inventory, requests } = getRoleFilteredData(user);

  // Summary metrics
  const totalTeams = teams.length;
  const totalProjects = projects.length;
  const totalInventory = inventory.reduce((sum, t) => sum + t.total, 0);
  const totalRequests = requests.length;

  // Project status distribution
  const projectStatusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Inventory assignment
  const inventoryAssigned = inventory.map(t => t.assigned.reduce((sum, a) => sum + a.quantity, 0));
  const inventoryAvailable = inventory.map((t, i) => t.total - inventoryAssigned[i]);

  // Requests by type/status
  const requestTypeCounts = requests.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const requestStatusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Project category distribution
  const projectCategoryCounts = projects.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Teams" value={totalTeams} />
        <Card title="Total Projects" value={totalProjects} />
        <Card title="Total Inventory" value={totalInventory} />
        <Card title="Total Requests" value={totalRequests} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Project Categories</h2>
          <Pie
            data={{
              labels: Object.keys(projectCategoryCounts),
              datasets: [
                {
                  data: Object.values(projectCategoryCounts),
                  backgroundColor: ["#2563eb", "#22d3ee", "#f59e42", "#f43f5e", "#a3e635", "#fbbf24"],
                },
              ],
            }}
            options={{ plugins: { legend: { position: "bottom" } } }}
          />
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Inventory Assignment</h2>
          <Bar
            data={{
              labels: inventory.map(t => t.name),
              datasets: [
                {
                  label: "Assigned",
                  data: inventoryAssigned,
                  backgroundColor: "#2563eb",
                },
                {
                  label: "Available",
                  data: inventoryAvailable,
                  backgroundColor: "#22d3ee",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics; 