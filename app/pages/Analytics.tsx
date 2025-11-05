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
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  UsersIcon,
  FolderIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Icon mapping for metric cards
const cardIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Total Teams": UsersIcon,
  "Total Projects": FolderIcon,
  "Total Inventory": CubeIcon,
  "Total Requests": ClipboardDocumentListIcon,
};

const Card = ({ title, value }: { title: string; value: React.ReactNode }) => {
  const Icon = cardIconMap[title] || FolderIcon;
  return (
    <div className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
      {/* Solid color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl" />
      
      {/* Icon with solid color */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      
      {/* Content */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const Analytics = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <PageSkeleton count={4} layout="card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12 fade-in">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
            <ChartBarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            No analytics data available
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
            Analytics data will appear here once activities are recorded in the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Analytics Dashboard</h1>
        <ButtonLoader
          onClick={handleRefresh}
          loading={refreshing}
          label="Refresh"
          loadingText="Refreshing..."
          variant="primary"
          size="md"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card title="Total Teams" value={analytics.summary?.total_teams || 0} />
        <Card title="Total Projects" value={analytics.summary?.total_projects || 0} />
        <Card title="Total Inventory" value={analytics.summary?.total_inventory || 0} />
        <Card title="Total Requests" value={analytics.summary?.total_requests || 0} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Project Categories</h2>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Recent Activity</h2>
          <div className="text-center text-gray-500 py-8">
            Analytics charts will be implemented based on real data from the backend
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 