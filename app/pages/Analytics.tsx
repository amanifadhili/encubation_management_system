// This Analytics page is now used as the main Dashboard for all users. Do not link separately in the sidebar.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import {
  getDashboardAnalytics,
  getInventoryReport,
  getRequestAnalytics,
  getConsumptionReports,
  getInventory,
  getRequests,
} from "../services/api";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  UsersIcon,
  FolderIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

// Color schemes for different card types
const cardColors: Record<string, { bg: string; icon: string; accent: string }> = {
  teams: { bg: "bg-blue-600", icon: "text-blue-600", accent: "bg-blue-600" },
  projects: { bg: "bg-purple-600", icon: "text-purple-600", accent: "bg-purple-600" },
  inventory: { bg: "bg-green-600", icon: "text-green-600", accent: "bg-green-600" },
  requests: { bg: "bg-orange-600", icon: "text-orange-600", accent: "bg-orange-600" },
  consumption: { bg: "bg-cyan-600", icon: "text-cyan-600", accent: "bg-cyan-600" },
  default: { bg: "bg-gray-600", icon: "text-gray-600", accent: "bg-gray-600" },
};

// Icon mapping for metric cards
const cardIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Total Teams": UsersIcon,
  "Total Projects": FolderIcon,
  "Total Inventory": CubeIcon,
  "Total Requests": ClipboardDocumentListIcon,
  "Available Items": CheckCircleIcon,
  "Low Stock Items": ExclamationTriangleIcon,
  "Out of Stock": XCircleIcon,
  "Assigned Items": CubeIcon,
  "Pending Requests": ClockIcon,
  "Approved Requests": CheckCircleIcon,
  "Declined Requests": XCircleIcon,
  "Approval Rate": ArrowTrendingUpIcon,
  "Total Consumption": FireIcon,
  "Active Maintenance": WrenchScrewdriverIcon,
};

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  colorType?: keyof typeof cardColors;
  onClick?: () => void;
}

const MetricCard = ({ title, value, subtitle, trend, colorType = "default", onClick }: MetricCardProps) => {
  const Icon = cardIconMap[title] || FolderIcon;
  const colors = cardColors[colorType] || cardColors.default;
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-300 ${
        isClickable ? "cursor-pointer" : ""
      }`}
    >
      {/* Solid color accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} rounded-t-2xl`} />

      {/* Icon with gradient background */}
      <div
        className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
};

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [requestStats, setRequestStats] = useState<any>(null);
  const [consumptionStats, setConsumptionStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Load all data in parallel
      const [
        dashboardData,
        inventoryReport,
        requestAnalytics,
        consumptionData,
        requestsList,
        inventoryList,
      ] = await Promise.allSettled([
        withRetry(() => getDashboardAnalytics(), {
          maxRetries: 3,
          initialDelay: 1000,
        }),
        withRetry(() => getInventoryReport(), {
          maxRetries: 2,
          initialDelay: 1000,
        }),
        withRetry(() => getRequestAnalytics({ period: "month" }), {
          maxRetries: 2,
          initialDelay: 1000,
        }),
        withRetry(() => getConsumptionReports({ period: "month" }), {
          maxRetries: 2,
          initialDelay: 1000,
        }),
        withRetry(() => getRequests({ limit: 5, page: 1 }), {
          maxRetries: 2,
          initialDelay: 1000,
        }),
        withRetry(() => getInventory({ limit: 5, page: 1 }), {
          maxRetries: 2,
          initialDelay: 1000,
        }),
      ]);

      if (dashboardData.status === "fulfilled") {
        setAnalytics(dashboardData.value);
      }
      if (inventoryReport.status === "fulfilled") {
        setInventoryStats(inventoryReport.value);
      }
      if (requestAnalytics.status === "fulfilled") {
        setRequestStats(requestAnalytics.value);
      }
      if (consumptionData.status === "fulfilled") {
        setConsumptionStats(consumptionData.value);
      }
      if (requestsList.status === "fulfilled") {
        const requests = requestsList.value?.requests || requestsList.value?.data?.requests || requestsList.value || [];
        setRecentRequests(Array.isArray(requests) ? requests.slice(0, 5) : []);
      }
      if (inventoryList.status === "fulfilled") {
        const items = inventoryList.value?.items || inventoryList.value?.data?.items || inventoryList.value || [];
        setRecentInventory(Array.isArray(items) ? items.slice(0, 5) : []);
      }
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      const errorDetails = ErrorHandler.parse(error);
      if (!ErrorHandler.isTimeout(error)) {
        showToast(errorDetails.userMessage || "Failed to load some dashboard data", "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAllData(true);
  };

  // Calculate inventory metrics
  const inventorySummary = inventoryStats?.summary || {};
  const totalInventory = inventorySummary.total_items || analytics?.summary?.total_inventory || 0;
  const availableItems = inventorySummary.available_items || 0;
  const lowStockItems = inventorySummary.low_stock_items || 0;
  const outOfStockItems = inventorySummary.out_of_stock_items || 0;
  const assignedQuantity = inventorySummary.assigned_quantity || 0;

  // Calculate request metrics
  const requestSummary = requestStats?.summary || {};
  const totalRequests = requestSummary.total_requests || analytics?.summary?.total_requests || 0;
  const pendingRequests = requestSummary.pending_requests || 0;
  const approvedRequests = requestSummary.approved_requests || 0;
  const declinedRequests = requestSummary.declined_requests || 0;
  const approvalRate = requestSummary.approval_rate || 0;

  // Calculate consumption metrics
  const consumptionSummary = consumptionStats?.summary || {};
  const totalConsumption = consumptionSummary.total_consumption || 0;
  const consumptionEvents = consumptionSummary.total_events || 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 fade-in bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive system analytics and insights</p>
        </div>
        <ButtonLoader
          onClick={handleRefresh}
          loading={refreshing}
          label="Refresh Data"
          loadingText="Refreshing..."
          variant="primary"
          size="md"
        />
      </div>

      {/* Primary Metrics - System Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Total Teams"
            value={analytics?.summary?.total_teams || 0}
            colorType="teams"
            onClick={() => navigate("/teams")}
          />
          <MetricCard
            title="Total Projects"
            value={analytics?.summary?.total_projects || 0}
            colorType="projects"
            onClick={() => navigate("/reports")}
          />
          <MetricCard
            title="Total Inventory"
            value={totalInventory}
            colorType="inventory"
            onClick={() => navigate("/inventory")}
          />
          <MetricCard
            title="Total Requests"
            value={totalRequests}
            colorType="requests"
            onClick={() => navigate("/requests")}
          />
        </div>
      </div>

      {/* Inventory Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Available Items"
            value={availableItems}
            subtitle={`${totalInventory > 0 ? Math.round((availableItems / totalInventory) * 100) : 0}% of total`}
            colorType="inventory"
            onClick={() => navigate("/inventory?status=available")}
          />
          <MetricCard
            title="Low Stock Items"
            value={lowStockItems}
            subtitle="Needs attention"
            colorType="default"
            onClick={() => navigate("/inventory?status=low_stock")}
          />
          <MetricCard
            title="Out of Stock"
            value={outOfStockItems}
            subtitle="Urgent restock needed"
            colorType="default"
            onClick={() => navigate("/inventory?status=out_of_stock")}
          />
          <MetricCard
            title="Assigned Items"
            value={assignedQuantity}
            subtitle="Currently in use"
            colorType="inventory"
            onClick={() => navigate("/inventory/assignments")}
          />
        </div>
      </div>

      {/* Request Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Pending Requests"
            value={pendingRequests}
            subtitle="Awaiting review"
            colorType="requests"
            onClick={() => navigate("/requests?status=pending_review")}
          />
          <MetricCard
            title="Approved Requests"
            value={approvedRequests}
            subtitle="Successfully processed"
            colorType="requests"
            onClick={() => navigate("/requests?status=approved")}
          />
          <MetricCard
            title="Declined Requests"
            value={declinedRequests}
            subtitle="Not approved"
            colorType="default"
            onClick={() => navigate("/requests?status=declined")}
          />
          <MetricCard
            title="Approval Rate"
            value={`${approvalRate.toFixed(1)}%`}
            subtitle="Overall success rate"
            colorType="requests"
            trend={approvalRate > 70 ? { value: 5, isPositive: true } : { value: 5, isPositive: false }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Categories Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Categories</h3>
          {analytics?.detailed?.project_categories && analytics.detailed.project_categories.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: analytics.detailed.project_categories.map((cat: any) => cat.category || "Unknown"),
                  datasets: [
                    {
                      data: analytics.detailed.project_categories.map((cat: any) => cat.count || 0),
                      backgroundColor: [
                        "#2563eb",
                        "#22d3ee",
                        "#f59e42",
                        "#f43f5e",
                        "#a3e635",
                        "#fbbf24",
                        "#8b5cf6",
                        "#ec4899",
                      ],
                      borderWidth: 2,
                      borderColor: "#ffffff",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", labels: { padding: 15, usePointStyle: true } },
                    tooltip: { enabled: true },
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">No project data available</div>
          )}
        </div>

        {/* Request Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status Distribution</h3>
          {requestStats?.status_breakdown && Object.keys(requestStats.status_breakdown).length > 0 ? (
            <div className="h-64">
              <Doughnut
                data={{
                  labels: Object.keys(requestStats.status_breakdown),
                  datasets: [
                    {
                      data: Object.values(requestStats.status_breakdown).map((v: any) => v.count || 0),
                      backgroundColor: ["#f59e42", "#10b981", "#ef4444", "#6366f1", "#8b5cf6"],
                      borderWidth: 2,
                      borderColor: "#ffffff",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", labels: { padding: 15, usePointStyle: true } },
                    tooltip: { enabled: true },
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">No request data available</div>
          )}
        </div>

        {/* Request Trends Over Time */}
        {requestStats?.time_series && requestStats.time_series.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Trends</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: requestStats.time_series.map((item: any) => item.date || item.period),
                  datasets: [
                    {
                      label: "Requests",
                      data: requestStats.time_series.map((item: any) => item.count || 0),
                      borderColor: "#2563eb",
                      backgroundColor: "rgba(37, 99, 235, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: "top" },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Priority Breakdown */}
        {requestStats?.priority_breakdown && Object.keys(requestStats.priority_breakdown).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Priority Distribution</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: Object.keys(requestStats.priority_breakdown),
                  datasets: [
                    {
                      label: "Requests",
                      data: Object.values(requestStats.priority_breakdown).map((v: any) => v.count || 0),
                      backgroundColor: ["#6366f1", "#3b82f6", "#f59e42", "#ef4444"],
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
            <button
              onClick={() => navigate("/requests")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          {recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request: any) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/requests/${request.id}`)}
                  className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{request.title || "Untitled Request"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.team?.team_name || request.requested_by || "Unknown"} •{" "}
                        {request.created_at ? formatDate(request.created_at) : "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : request.status === "pending_review"
                          ? "bg-yellow-100 text-yellow-700"
                          : request.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {request.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No recent requests</div>
          )}
        </div>

        {/* Recent Inventory Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Inventory Items</h3>
            <button
              onClick={() => navigate("/inventory")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          {recentInventory.length > 0 ? (
            <div className="space-y-3">
              {recentInventory.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/inventory/${item.id}`)}
                  className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name || "Unnamed Item"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.category || "No category"} • Qty: {item.total_quantity || 0}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === "available"
                          ? "bg-green-100 text-green-700"
                          : item.status === "low_stock"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "out_of_stock"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No recent inventory items</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/requests/create")}
            className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Create Request</p>
          </button>
          <button
            onClick={() => navigate("/inventory")}
            className="p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
          >
            <CubeIcon className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">View Inventory</p>
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
          >
            <ChartBarIcon className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">View Reports</p>
          </button>
          <button
            onClick={() => navigate("/teams")}
            className="p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
          >
            <UsersIcon className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Manage Teams</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 