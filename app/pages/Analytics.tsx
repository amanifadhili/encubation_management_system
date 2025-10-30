// This Analytics page is now used as the main Dashboard for all users. Do not link separately in the sidebar.
import React, { useState, useEffect } from "react";
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
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { getDashboardAnalytics } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Card = ({ title, value }: { title: string; value: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-4 flex-1 min-w-[180px]">
    <div className="text-lg font-semibold text-white opacity-90">{title}</div>
    <div className="text-3xl font-bold text-white mt-2">{value}</div>
  </div>
);

const Analytics = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const data = await withRetry(
        () => getDashboardAnalytics(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            showToast(`Retrying... (${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      const errorDetails = ErrorHandler.parse(error);
      
      if (ErrorHandler.isTimeout(error)) {
        showToast('Request timed out. Please try again.', 'error');
      } else {
        showToast(errorDetails.userMessage || 'Failed to load analytics', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-blue-400 py-12">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center text-blue-400 py-12">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Teams" value={analytics.summary?.total_teams || 0} />
        <Card title="Total Projects" value={analytics.summary?.total_projects || 0} />
        <Card title="Total Inventory" value={analytics.summary?.total_inventory || 0} />
        <Card title="Total Requests" value={analytics.summary?.total_requests || 0} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Project Categories</h2>
          {analytics.detailed?.project_categories && analytics.detailed.project_categories.length > 0 ? (
            <Pie
              data={{
                labels: analytics.detailed.project_categories.map((cat: any) => cat.category),
                datasets: [
                  {
                    data: analytics.detailed.project_categories.map((cat: any) => cat.count),
                    backgroundColor: ["#2563eb", "#22d3ee", "#f59e42", "#f43f5e", "#a3e635", "#fbbf24"],
                  },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom" } } }}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">No project data available</div>
          )}
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Recent Activity</h2>
          <div className="text-center text-gray-500 py-8">
            Analytics charts will be implemented based on real data from the backend
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 