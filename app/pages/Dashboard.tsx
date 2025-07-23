import React from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { analytics, incubators, evaluations, announcements } from "../mock/sampleData";

const Card: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-4">
    <div className="text-lg font-semibold text-white opacity-90">{title}</div>
    <div className="text-3xl font-bold text-white mt-2">{value}</div>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-semibold mb-2 text-blue-900">{children}</h2>
);

const Dashboard = () => {
  const { user } = useAuth();
  const showToast = useToast();

  if (!user) return null;

  // Director Dashboard
  if (user.role === "director") {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Director Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Active Projects" value={analytics.activeProjects} />
          <Card title="Incubator Engagement" value={`${analytics.incubatorEngagement}%`} />
          <Card title="Inventory Available" value={analytics.inventoryStatus.available} />
        </div>
        <div className="mt-8">
          <SectionTitle>Recent Evaluations</SectionTitle>
          <ul className="divide-y">
            {evaluations.map(ev => (
              <li key={ev.id} className="py-2 flex justify-between text-blue-800">
                <span>{ev.evaluator} → Team #{ev.incubatorId}</span>
                <span className="font-bold text-blue-700">{ev.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Manager Dashboard
  if (user.role === "manager") {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Manager Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Teams Managed" value={incubators.length} />
          <Card title="Announcements" value={announcements.length} />
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
          onClick={() => showToast("Announcement sent!", "success")}
        >
          Send Announcement (Demo Toast)
        </button>
      </div>
    );
  }

  // Mentor Dashboard
  if (user.role === "mentor") {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Mentor Dashboard</h1>
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-4">
          <div className="text-lg font-semibold text-white opacity-90">Assigned Teams</div>
          <ul className="list-disc ml-6 mt-2 text-white">
            {incubators.filter(i => user && i.mentor === user.name).map(i => (
              <li key={i.id}>{i.name}</li>
            ))}
          </ul>
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
          onClick={() => showToast("Feedback submitted!", "success")}
        >
          Submit Feedback (Demo Toast)
        </button>
      </div>
    );
  }

  // Incubator Dashboard
  if (user.role === "incubator") {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Incubator Dashboard</h1>
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-4">
          <div className="text-lg font-semibold text-white opacity-90">My Project</div>
          <div className="mt-2 text-white">{incubators.find(i => i.members.includes(user.name.split(' ')[0]))?.project || "No project assigned."}</div>
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
          onClick={() => showToast("Project updated!", "success")}
        >
          Update Project (Demo Toast)
        </button>
      </div>
    );
  }

  return null;
};

export default Dashboard; 