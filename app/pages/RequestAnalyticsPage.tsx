import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Badge from "../components/Badge";
import Table from "../components/Table";
import {
  getRequestAnalytics,
  getIncubators,
} from "../services/api";
import { ChartBarIcon, ClipboardDocumentListIcon, ClockIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

const RequestAnalyticsPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // State for analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // Dropdown data
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
    loadAnalytics();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await withRetry(() => getIncubators(), { maxRetries: 2 });
      const teamsData = data?.teams || data?.data?.teams || data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error: any) {
      console.error("Error loading teams:", error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (periodFilter) params.period = periodFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (teamFilter) params.team_id = teamFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await withRetry(() => getRequestAnalytics(params));
      setAnalytics(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading request analytics");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get priority badge variant
  const getPriorityVariant = (priority: string): "default" | "info" | "warning" | "danger" => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "default";
      case "medium":
        return "info";
      case "high":
        return "warning";
      case "urgent":
        return "danger";
      default:
        return "default";
    }
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string): "default" | "info" | "warning" | "danger" | "success" => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "default";
      case "submitted":
      case "pending_review":
      case "ordered":
      case "in_transit":
        return "info";
      case "approved":
      case "delivered":
      case "completed":
        return "success";
      case "declined":
        return "danger";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Chart data preparation
  const statusBreakdownData = useMemo(() => {
    if (!analytics?.status_breakdown) return null;

    const breakdown = analytics.status_breakdown;
    const statusColors: Record<string, string> = {
      draft: "#9ca3af",
      submitted: "#3b82f6",
      pending_review: "#f59e0b",
      approved: "#10b981",
      partially_approved: "#3b82f6",
      declined: "#ef4444",
      cancelled: "#9ca3af",
      ordered: "#3b82f6",
      in_transit: "#3b82f6",
      delivered: "#10b981",
      completed: "#10b981",
      returned: "#f59e0b",
    };

    return {
      labels: breakdown.map((item: any) => {
        const status = item.status || "unknown";
        return status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      }),
      datasets: [
        {
          data: breakdown.map((item: any) => item.count || 0),
          backgroundColor: breakdown.map((item: any) => {
            const status = (item.status || "unknown").toLowerCase();
            return statusColors[status] || "#9ca3af";
          }),
        },
      ],
    };
  }, [analytics]);

  const priorityBreakdownData = useMemo(() => {
    if (!analytics?.priority_breakdown) return null;

    const breakdown = analytics.priority_breakdown;
    const priorityColors: Record<string, string> = {
      low: "#9ca3af",
      medium: "#3b82f6",
      high: "#f59e0b",
      urgent: "#ef4444",
    };

    return {
      labels: breakdown.map((item: any) => {
        const priority = item.priority || "unknown";
        return priority.charAt(0).toUpperCase() + priority.slice(1);
      }),
      datasets: [
        {
          data: breakdown.map((item: any) => item.count || 0),
          backgroundColor: breakdown.map((item: any) => {
            const priority = (item.priority || "unknown").toLowerCase();
            return priorityColors[priority] || "#9ca3af";
          }),
        },
      ],
    };
  }, [analytics]);

  const timeSeriesData = useMemo(() => {
    if (!analytics?.time_series) return null;

    const series = analytics.time_series;
    return {
      labels: series.map((item: any) => item.period || item.date),
      datasets: [
        {
          label: "Total Requests",
          data: series.map((item: any) => item.total || 0),
          backgroundColor: "rgba(37, 99, 235, 0.6)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 2,
        },
        {
          label: "Approved",
          data: series.map((item: any) => item.approved || 0),
          backgroundColor: "rgba(16, 185, 129, 0.6)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
        },
        {
          label: "Pending",
          data: series.map((item: any) => item.pending || 0),
          backgroundColor: "rgba(245, 158, 11, 0.6)",
          borderColor: "rgba(245, 158, 11, 1)",
          borderWidth: 2,
        },
        {
          label: "Declined",
          data: series.map((item: any) => item.declined || 0),
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics]);

  // Table columns
  const teamAnalysisColumns: TableColumn<any>[] = [
    { key: "team_name", label: "Team", sortable: true },
    { key: "total_requests", label: "Total Requests", sortable: true },
    { key: "approved", label: "Approved", sortable: true },
    { key: "pending", label: "Pending", sortable: true },
    { key: "declined", label: "Declined", sortable: true },
    {
      key: "approval_rate",
      label: "Approval Rate",
      render: (row) => {
        const rate = row.approval_rate || 0;
        return `${rate.toFixed(1)}%`;
      },
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => navigate(`/requests?team_id=${row.team_id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          View Requests
        </button>
      ),
    },
  ];

  const mostRequestedItemsColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "request_count", label: "Request Count", sortable: true },
    {
      key: "total_quantity",
      label: "Total Quantity Requested",
      sortable: true,
    },
  ];

  // Calculate overview stats
  const overviewStats = useMemo(() => {
    if (!analytics?.overview) return null;

    const overview = analytics.overview;
    const total = overview.total_requests || 0;
    const approved = overview.approved || 0;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0";

    return {
      total,
      approved,
      pending: overview.pending || 0,
      declined: overview.declined || 0,
      approvalRate,
      averageApprovalTime: overview.average_approval_time || "N/A",
    };
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <PageSkeleton count={3} layout="card" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Request Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Material request patterns and insights</p>
        </div>
        <ButtonLoader
          loading={loading}
          onClick={loadAnalytics}
          label="Refresh"
          variant="primary"
          size="md"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name || team.teamName || "Unnamed Team"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <ButtonLoader
            loading={loading}
            onClick={loadAnalytics}
            label="Apply Filters"
            variant="primary"
            size="sm"
          />
        </div>
      </div>

      {/* Request Overview Section */}
      {overviewStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewStats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="success">Approved</Badge>
              <p className="text-sm font-medium text-gray-600">Approved</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewStats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">Pending</Badge>
              <p className="text-sm font-medium text-gray-600">Pending</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewStats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="danger">Declined</Badge>
              <p className="text-sm font-medium text-gray-600">Declined</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewStats.declined}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-600">Approval Rate</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewStats.approvalRate}%</p>
          </div>
        </div>
      )}

      {/* Status Breakdown Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Status Breakdown
        </h2>
        {statusBreakdownData ? (
          <div className="max-w-md mx-auto">
            <Doughnut
              data={statusBreakdownData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "right" },
                },
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">No status breakdown data available</div>
        )}
      </div>

      {/* Priority Breakdown Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Priority Breakdown
        </h2>
        {priorityBreakdownData ? (
          <div className="max-w-md mx-auto">
            <Pie
              data={priorityBreakdownData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "right" },
                },
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">No priority breakdown data available</div>
        )}
      </div>

      {/* Time Series Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Requests Over Time
        </h2>
        {timeSeriesData ? (
          <Line
            data={timeSeriesData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true },
                title: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        ) : (
          <div className="text-center text-gray-600 py-8">No time series data available</div>
        )}
      </div>

      {/* Team Analysis Section */}
      {analytics?.team_analysis && analytics.team_analysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Analysis</h2>
          <Table
            columns={teamAnalysisColumns}
            data={analytics.team_analysis}
            emptyMessage="No team analysis data available"
          />
        </div>
      )}

      {/* Most Requested Items Section */}
      {analytics?.most_requested_items && analytics.most_requested_items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Requested Items</h2>
          <Table
            columns={mostRequestedItemsColumns}
            data={analytics.most_requested_items}
            emptyMessage="No most requested items data available"
          />
        </div>
      )}
    </div>
  );
};

export default RequestAnalyticsPage;

