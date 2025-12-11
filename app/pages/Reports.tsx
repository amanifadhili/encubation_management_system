import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import {
  getTeamsReport,
  getInventoryReport,
  getProjectsReport,
  exportReport,
  getAdvancedReports,
  getTimeSeriesAnalytics,
  getSystemMetrics,
  getCrossEntityAnalytics,
  getGeneralReport,
  exportGeneralReportCsv,
} from "../services/api";
import jsPDF from "jspdf";
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
  TimeScale,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import Select from "react-select";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { ExportManager } from "../utils/exportManager";
import type { ExportOptions, ReportData } from "../utils/exportManager";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale
);

const Reports = () => {
  const { user } = useAuth();
  const showToast = useToast();

  // Basic reports state
  const [teamsReport, setTeamsReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [projectsReport, setProjectsReport] = useState<any>(null);

  // Advanced reports state
  const [activeReport, setActiveReport] = useState("overview");
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [filters, setFilters] = useState({
    report_type: "teams",
    date_from: "",
    date_to: "",
    status: "",
    category: "",
    team_id: "",
    sort_by: "created_at",
    sort_order: "desc" as "asc" | "desc",
    page: 1,
    limit: 50,
  });
  const [generalFilters, setGeneralFilters] = useState<any>({
    status: "",
    category: "",
    team_id: "",
    mentor_id: "",
    date_from: "",
    date_to: "",
    progress_min: "",
    progress_max: "",
    team_status: "",
    enrollment_from: "",
    enrollment_to: "",
    rdb_registration_status: "",
  });
  const [generalData, setGeneralData] = useState<any[]>([]);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalExporting, setGeneralExporting] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false);
  const [systemMetricsLoading, setSystemMetricsLoading] = useState(false);
  const [crossEntityLoading, setCrossEntityLoading] = useState(false);

  // New data states
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [crossEntityData, setCrossEntityData] = useState<any>(null);

  // Load reports on mount
  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const [teams, inventory, projects] = await Promise.all([
        getTeamsReport(),
        getInventoryReport(),
        getProjectsReport(),
      ]);
      setTeamsReport(teams);
      setInventoryReport(inventory);
      setProjectsReport(projects);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadReports(true);
  };

  // Load advanced reports with filters
  const loadAdvancedReports = async () => {
    setAdvancedLoading(true);
    try {
      console.log("Loading advanced reports with filters:", filters);
      const data = await getAdvancedReports(filters);
      console.log("Advanced reports data:", data);
      setAdvancedData(data);
    } catch (error: any) {
      console.error("Advanced reports error:", error);
      ErrorHandler.handleError(error, showToast, "loading advanced reports");
    } finally {
      setAdvancedLoading(false);
    }
  };

  // Load time series data
  const loadTimeSeriesData = async (
    metric: string = "teams",
    period: string = "monthly"
  ) => {
    setTimeSeriesLoading(true);
    try {
      console.log("Loading time series for:", { metric, period });
      const data = await getTimeSeriesAnalytics({
        metric,
        period,
        start_date: filters.date_from || undefined,
        end_date: filters.date_to || undefined,
      });
      console.log("Time series data:", data);
      setTimeSeriesData(data);
    } catch (error: any) {
      console.error("Time series error:", error);
      ErrorHandler.handleError(error, showToast, "loading time series data");
    } finally {
      setTimeSeriesLoading(false);
    }
  };

  // General report (combined) - JSON
  const loadGeneralReport = async () => {
    setGeneralLoading(true);
    try {
      const data = await getGeneralReport({ ...generalFilters });
      const rows = data?.data?.rows || data?.rows || [];
      setGeneralData(rows);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading general report");
    } finally {
      setGeneralLoading(false);
    }
  };

  const downloadGeneralCsv = async () => {
    setGeneralExporting(true);
    try {
      const response = await exportGeneralReportCsv({ ...generalFilters });
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "general_report.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("CSV downloaded", "success");
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "exporting general report");
    } finally {
      setGeneralExporting(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on filter change
  };

  // Apply filters and reload data
  const applyFilters = () => {
    if (activeReport === "overview") {
      loadReports(false); // Load basic reports for overview
    } else if (activeReport === "trends") {
      loadTimeSeriesData(filters.report_type, "monthly");
    } else {
      // For specific entity reports, load advanced data
      loadAdvancedReports();
    }
  };

  // Handle report type change with automatic filter updates
  const handleReportTypeChange = (reportType: string) => {
    setActiveReport(reportType);

    // Update filters based on report type
    if (reportType === "overview") {
      // Overview doesn't need advanced filters
      loadReports(false);
    } else if (reportType === "system-metrics") {
      // Load system-wide metrics
      loadSystemMetrics();
    } else if (reportType === "cross-entity") {
      // Load cross-entity analytics
      loadCrossEntityAnalytics();
    } else if (reportType === "trends") {
      // Trends uses time series data
      setFilters((prev) => ({ ...prev, report_type: "teams" })); // Default to teams for trends
      loadTimeSeriesData("teams", "monthly");
    } else {
      // Entity-specific reports
      setFilters((prev) => ({
        ...prev,
        report_type: reportType,
        status: "",
        category: reportType === "projects" ? "" : prev.category,
        team_id: "",
        page: 1,
      }));
      loadAdvancedReports();
    }
  };

  // Load system metrics
  const loadSystemMetrics = async () => {
    setSystemMetricsLoading(true);
    try {
      console.log("Loading system metrics...");
      const data = await getSystemMetrics();
      console.log("System metrics data:", data);
      setSystemMetrics(data);
    } catch (error: any) {
      console.error("System metrics error:", error);
      ErrorHandler.handleError(error, showToast, "loading system metrics");
    } finally {
      setSystemMetricsLoading(false);
    }
  };

  // Load cross-entity analytics
  const loadCrossEntityAnalytics = async () => {
    setCrossEntityLoading(true);
    try {
      console.log("Loading cross-entity analytics...");
      const data = await getCrossEntityAnalytics();
      console.log("Cross-entity analytics data:", data);
      setCrossEntityData(data);
    } catch (error: any) {
      console.error("Cross-entity analytics error:", error);
      ErrorHandler.handleError(
        error,
        showToast,
        "loading cross-entity analytics"
      );
    } finally {
      setCrossEntityLoading(false);
    }
  };

  // Enhanced export function with multiple formats - exports real filtered data
  const handleExport = async (format: "pdf" | "excel" | "csv" = "pdf") => {
    setExporting(true);
    try {
      console.log(
        `Starting ${format.toUpperCase()} export for report type:`,
        activeReport,
        "with filters:",
        filters
      );

      let exportData: ReportData = {};
      let title = "Incubation Management Report";
      const reportTypeLabel =
        activeReport.charAt(0).toUpperCase() + activeReport.slice(1);

      // Build filter metadata
      const filterMetadata: any = {
        report_type: activeReport,
        date_from: filters.date_from || "All time",
        date_to: filters.date_to || "All time",
        status: filters.status || "All statuses",
        category: filters.category || "All categories",
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      // Get data based on current report type - using actual filtered data
      switch (activeReport) {
        case "overview":
          title = "System Overview Report";
          if (teamsReport || inventoryReport || projectsReport) {
            exportData = {
              summary: {
                total_teams: teamsReport?.summary?.total_teams || 0,
                active_teams: teamsReport?.summary?.active_teams || 0,
                total_projects: projectsReport?.summary?.total_projects || 0,
                active_projects: projectsReport?.summary?.active_projects || 0,
                completed_projects:
                  projectsReport?.summary?.completed_projects || 0,
                total_inventory: inventoryReport?.summary?.total_items || 0,
                assigned_quantity:
                  inventoryReport?.summary?.assigned_quantity || 0,
                available_quantity:
                  inventoryReport?.summary?.available_quantity || 0,
              },
              filters: filterMetadata,
              generated_at: new Date().toISOString(),
            };
          }
          break;

        case "system-metrics":
          title = "System Metrics Report";
          if (systemMetrics) {
            exportData = {
              metrics: systemMetrics,
              filters: filterMetadata,
              generated_at: new Date().toISOString(),
            };
          } else {
            throw new Error("No system metrics data available to export");
          }
          break;

        case "cross-entity":
          title = "Cross-Entity Analytics Report";
          if (crossEntityData) {
            // Prepare detailed data for cross-entity
            const details: any[] = [];

            // Add top performing teams
            if (crossEntityData.top_performing_teams) {
              crossEntityData.top_performing_teams.forEach((team: any) => {
                details.push({
                  type: "Top Performing Team",
                  name: team.team_name,
                  total_projects: team.total_projects,
                  completed_projects: team.completed_projects,
                  completion_rate: `${team.completion_rate.toFixed(1)}%`,
                });
              });
            }

            // Add most active users
            if (crossEntityData.most_active_users) {
              crossEntityData.most_active_users.forEach((user: any) => {
                details.push({
                  type: "Active User",
                  name: user.name,
                  activity_score: user.activity_score,
                  teams_count: user.teams_count,
                  files_uploaded: user.files_uploaded,
                });
              });
            }

            exportData = {
              summary: crossEntityData,
              details: details,
              filters: filterMetadata,
              generated_at: new Date().toISOString(),
            };
          } else {
            throw new Error("No cross-entity data available to export");
          }
          break;

        case "trends":
          title = "Time Series Trends Report";
          if (timeSeriesData?.series) {
            // Prepare time series data as details
            const timeSeriesDetails = timeSeriesData.series.map(
              (item: any) => ({
                period: item.period,
                value: item.value,
                metric: filters.report_type,
              })
            );

            exportData = {
              summary: {
                metric: filters.report_type,
                period: "monthly",
                total_data_points: timeSeriesData.series.length,
              },
              details: timeSeriesDetails,
              filters: filterMetadata,
              generated_at: new Date().toISOString(),
            };
          } else {
            throw new Error("No time series data available to export");
          }
          break;

        case "teams":
        case "projects":
        case "inventory":
        case "users":
          title = `${reportTypeLabel} Analysis Report`;
          if (advancedData && advancedData[filters.report_type]) {
            // Get the actual filtered data array
            const dataArray = advancedData[filters.report_type] || [];

            // Build comprehensive details with all columns
            const details = dataArray.map((item: any) => {
              const baseItem: any = {
                name: item.team_name || item.name || item.title || "N/A",
                status: item.status || "N/A",
                created_at: item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "N/A",
              };

              // Add report-type specific columns
              if (filters.report_type === "teams") {
                baseItem.members = item.metrics?.member_count || 0;
                baseItem.projects = item.metrics?.project_count || 0;
                baseItem.mentors = item.metrics?.mentor_count || 0;
                baseItem.company_name = item.company_name || "N/A";
              } else if (filters.report_type === "projects") {
                baseItem.team = item.team?.team_name || "N/A";
                baseItem.progress = `${item.progress || 0}%`;
                baseItem.files = item.metrics?.file_count || 0;
                baseItem.category = item.category || "N/A";
                baseItem.description = item.description || "N/A";
              } else if (filters.report_type === "inventory") {
                baseItem.total_quantity = item.total_quantity || 0;
                baseItem.available_quantity = item.available_quantity || 0;
                baseItem.utilization_rate =
                  item.metrics?.utilization_rate || "0%";
                baseItem.description = item.description || "N/A";
                baseItem.status_inventory = item.status || "N/A";
              } else if (filters.report_type === "users") {
                baseItem.email = item.email || "N/A";
                baseItem.role = item.role || "N/A";
                baseItem.teams_count = item.metrics?.teams_count || 0;
                baseItem.files_uploaded = item.metrics?.files_uploaded || 0;
                baseItem.created_at = item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "N/A";
              }

              return baseItem;
            });

            // Calculate summary statistics
            const total = dataArray.length;
            const activeCount = dataArray.filter(
              (item: any) => item.status === "active"
            ).length;
            const pendingCount = dataArray.filter(
              (item: any) => item.status === "pending"
            ).length;
            const completedCount = dataArray.filter(
              (item: any) => item.status === "completed"
            ).length;

            exportData = {
              summary: {
                total: total,
                active: activeCount,
                pending: pendingCount,
                completed: completedCount,
                report_type: filters.report_type,
              },
              details: details,
              filters: filterMetadata,
              generated_at: new Date().toISOString(),
            };
          } else {
            throw new Error(
              `No ${filters.report_type} data available to export. Please apply filters first.`
            );
          }
          break;

        default:
          throw new Error(`Unsupported report type: ${activeReport}`);
      }

      // Validate that we have data to export
      if (!exportData.summary && !exportData.details && !exportData.metrics) {
        throw new Error("No data available to export. Please load data first.");
      }

      // Use the new ExportManager
      const exportOptions: ExportOptions = {
        format,
        title,
        template: activeReport === "system-metrics" ? "detailed" : "executive",
        includeCharts: false, // Can be enhanced later
        dateRange:
          filters.date_from && filters.date_to
            ? {
                start: filters.date_from,
                end: filters.date_to,
              }
            : undefined,
      };

      await ExportManager.exportReport(exportData, exportOptions);

      console.log(`${format.toUpperCase()} export completed successfully`);
      showToast(
        `${format.toUpperCase()} report exported successfully with ${
          exportData.details?.length || 0
        } records!`,
        "success"
      );
    } catch (error: any) {
      console.error("Export error:", error);
      const errorMessage =
        error.message || `Failed to export ${format.toUpperCase()} report`;
      showToast(errorMessage, "error");
      ErrorHandler.handleError(
        error,
        showToast,
        `exporting ${format.toUpperCase()} report`
      );
    } finally {
      setExporting(false);
    }
  };

  // Test function to check if backend is responding
  const testBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const result = await getTeamsReport();
      console.log("Backend test result:", result);
      showToast("Backend connection successful!", "success");
    } catch (error: any) {
      console.error("Backend test failed:", error);
      showToast("Backend connection failed!", "error");
    }
  };

  // Report type options
  const reportTypes = [
    { value: "overview", label: "Overview Dashboard" },
    { value: "system-metrics", label: "System Metrics" },
    { value: "cross-entity", label: "Cross-Entity Analytics" },
    { value: "teams", label: "Teams Analysis" },
    { value: "projects", label: "Projects Analysis" },
    { value: "inventory", label: "Inventory Analysis" },
    { value: "users", label: "Users Analysis" },
    { value: "trends", label: "Time Trends" },
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "inactive", label: "Inactive" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "Technology", label: "Technology" },
    { value: "Agriculture", label: "Agriculture" },
    { value: "Health", label: "Health" },
    { value: "Education", label: "Education" },
    { value: "Design", label: "Design" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Date Created" },
    { value: "name", label: "Name" },
    { value: "status", label: "Status" },
  ];

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Advanced Reports & Analytics
              </h1>
              <div className="text-white opacity-90 mb-2">
                Comprehensive insights with advanced filtering and
                visualizations.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLoader
                onClick={handleRefresh}
                loading={refreshing}
                label="Refresh"
                loadingText="Refreshing..."
                variant="secondary"
                size="md"
              />
              <ButtonLoader
                onClick={testBackendConnection}
                loading={false}
                label="Test Backend"
                variant="outline"
                size="md"
              />
              <div className="flex gap-1">
                <ButtonLoader
                  onClick={() => handleExport("pdf")}
                  loading={exporting}
                  label="Export PDF"
                  loadingText="Exporting..."
                  variant="success"
                  size="md"
                />
                <ButtonLoader
                  onClick={() => handleExport("excel")}
                  loading={exporting}
                  label="Export Excel"
                  loadingText="Exporting..."
                  variant="primary"
                  size="md"
                />
                <ButtonLoader
                  onClick={() => handleExport("csv")}
                  loading={exporting}
                  label="Export CSV"
                  loadingText="Exporting..."
                  variant="outline"
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* General Combined Report (Projects/Teams/Mentors) */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-white text-lg font-semibold">General Report (CSV/JSON)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Date From</label>
                  <input
                    type="date"
                    value={generalFilters.date_from}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, date_from: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Date To</label>
                  <input
                    type="date"
                    value={generalFilters.date_to}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, date_to: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Status</label>
                  <input
                    type="text"
                    placeholder="active/pending/completed"
                    value={generalFilters.status}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Category/Field</label>
                  <input
                    type="text"
                    placeholder="Technology, Health..."
                    value={generalFilters.category}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Team Status</label>
                  <input
                    type="text"
                    placeholder="active/pending/inactive"
                    value={generalFilters.team_status}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, team_status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">RDB Registration</label>
                  <input
                    type="text"
                    placeholder="Registered/Pending/Not Registered"
                    value={generalFilters.rdb_registration_status}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, rdb_registration_status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Progress Min (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={generalFilters.progress_min}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, progress_min: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Progress Max (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={generalFilters.progress_max}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, progress_max: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Enrollment From</label>
                  <input
                    type="date"
                    value={generalFilters.enrollment_from}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, enrollment_from: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Enrollment To</label>
                  <input
                    type="date"
                    value={generalFilters.enrollment_to}
                    onChange={(e) =>
                      setGeneralFilters((p: any) => ({ ...p, enrollment_to: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3 flex flex-col justify-between">
              <div className="text-white text-sm">
                Filters apply to the combined report (companies + projects + mentors). Leave blank for all.
              </div>
              <div className="flex flex-col gap-2">
                <ButtonLoader
                  loading={generalLoading}
                  onClick={loadGeneralReport}
                  label="Apply Filters"
                  loadingText="Loading..."
                  variant="primary"
                  type="button"
                />
                <ButtonLoader
                  loading={generalExporting}
                  onClick={downloadGeneralCsv}
                  label="Download CSV"
                  loadingText="Downloading..."
                  variant="secondary"
                  type="button"
                />
              </div>
            </div>
          </div>

          {/* General Report Table */}
          {generalData.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-900">General Report Results</h3>
                <div className="text-sm text-gray-600">{generalData.length} records</div>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-blue-900">
                  <tr>
                    <th className="px-3 py-2 text-left">S/N</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">Innovator</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Project</th>
                    <th className="px-3 py-2 text-left">Field</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Progress</th>
                    <th className="px-3 py-2 text-left">Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generalData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      <td className="px-3 py-2">{row.sn || idx + 1}</td>
                      <td className="px-3 py-2">{row.company_name || "-"}</td>
                      <td className="px-3 py-2">{row.innovator_name || "-"}</td>
                      <td className="px-3 py-2">{row.innovator_email || "-"}</td>
                      <td className="px-3 py-2">{row.innovator_phone || "-"}</td>
                      <td className="px-3 py-2">{row.project_title || "-"}</td>
                      <td className="px-3 py-2">{row.project_field || "-"}</td>
                      <td className="px-3 py-2">{row.current_status || row.status_at_enrollment || "-"}</td>
                      <td className="px-3 py-2">{row.progress != null ? `${row.progress}%` : "-"}</td>
                      <td className="px-3 py-2">{row.mentor_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report Type Selector */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleReportTypeChange(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeReport === type.value
                      ? "bg-white text-blue-600 shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Filters Based on Report Type */}
          {activeReport !== "overview" && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range - Available for all report types */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) =>
                      handleFilterChange("date_from", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) =>
                      handleFilterChange("date_to", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                  />
                </div>

                {/* Status Filter - Available for teams, projects, inventory, users */}
                {(activeReport === "teams" ||
                  activeReport === "projects" ||
                  activeReport === "inventory" ||
                  activeReport === "users") && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Status
                    </label>
                    <Select
                      value={statusOptions.find(
                        (opt) => opt.value === filters.status
                      )}
                      onChange={(option) =>
                        handleFilterChange("status", option?.value || "")
                      }
                      options={statusOptions}
                      className="text-blue-900"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "white",
                        }),
                        menu: (base) => ({ ...base, backgroundColor: "white" }),
                      }}
                    />
                  </div>
                )}

                {/* Category Filter - Only for projects */}
                {activeReport === "projects" && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Category
                    </label>
                    <Select
                      value={categoryOptions.find(
                        (opt) => opt.value === filters.category
                      )}
                      onChange={(option) =>
                        handleFilterChange("category", option?.value || "")
                      }
                      options={categoryOptions}
                      className="text-blue-900"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "white",
                        }),
                        menu: (base) => ({ ...base, backgroundColor: "white" }),
                      }}
                    />
                  </div>
                )}

                {/* Metric Selection - Only for trends */}
                {activeReport === "trends" && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Metric
                    </label>
                    <select
                      value={filters.report_type}
                      onChange={(e) =>
                        handleFilterChange("report_type", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                    >
                      <option value="teams">Teams</option>
                      <option value="projects">Projects</option>
                      <option value="users">Users</option>
                      <option value="inventory_items">Inventory Items</option>
                      <option value="requests">Requests</option>
                      <option value="announcements">Announcements</option>
                      <option value="notifications">Notifications</option>
                      <option value="messages">Messages</option>
                    </select>
                  </div>
                )}

                {/* Period Selection - Only for trends */}
                {activeReport === "trends" && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Period
                    </label>
                    <select
                      value="monthly"
                      onChange={(e) =>
                        loadTimeSeriesData(filters.report_type, e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Apply Filters Button */}
              <div className="flex gap-2 mt-4">
                <ButtonLoader
                  onClick={applyFilters}
                  loading={advancedLoading || timeSeriesLoading}
                  label="Apply Filters"
                  loadingText="Loading..."
                  variant="primary"
                  size="md"
                />
                {(activeReport === "teams" ||
                  activeReport === "projects" ||
                  activeReport === "inventory" ||
                  activeReport === "users") && (
                  <button
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        date_from: "",
                        date_to: "",
                        status: "",
                        category: "",
                        team_id: "",
                        page: 1,
                      }));
                      setTimeout(applyFilters, 100);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Report Content */}
        {activeReport === "overview" ? (
          // Original overview dashboard
          loading ? (
            <PageSkeleton count={3} layout="card" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  Teams Report
                </h3>
                {teamsReport?.summary ? (
                  <div className="text-blue-700">
                    <div>
                      Total Teams: {teamsReport.summary.total_teams || 0}
                    </div>
                    <div>
                      Active Teams: {teamsReport.summary.active_teams || 0}
                    </div>
                    <div>
                      Completed Projects:{" "}
                      {teamsReport.summary.total_projects || 0}
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-400">No team data available</div>
                )}
              </div>

              <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  Inventory Report
                </h3>
                {inventoryReport?.summary ? (
                  <div className="text-blue-700">
                    <div>
                      Total Items: {inventoryReport.summary.total_items || 0}
                    </div>
                    <div>
                      Assigned Items:{" "}
                      {inventoryReport.summary.assigned_quantity || 0}
                    </div>
                    <div>
                      Available Items:{" "}
                      {inventoryReport.summary.available_quantity || 0}
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-400">
                    No inventory data available
                  </div>
                )}
              </div>

              <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  Projects Report
                </h3>
                {projectsReport?.summary ? (
                  <div className="text-blue-700">
                    <div>
                      Total Projects:{" "}
                      {projectsReport.summary.total_projects || 0}
                    </div>
                    <div>
                      Active Projects:{" "}
                      {projectsReport.summary.active_projects || 0}
                    </div>
                    <div>
                      Completed Projects:{" "}
                      {projectsReport.summary.completed_projects || 0}
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-400">No project data available</div>
                )}
              </div>
            </div>
          )
        ) : activeReport === "system-metrics" ? (
          // System-wide metrics dashboard
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6">
              System-wide Metrics Dashboard
            </h2>

            {systemMetricsLoading ? (
              <PageSkeleton count={3} layout="card" />
            ) : systemMetrics ? (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {systemMetrics.total_users || 0}
                    </div>
                    <div className="text-sm text-blue-800">Total Users</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {systemMetrics.active_users || 0}
                    </div>
                    <div className="text-sm text-green-800">Active Users</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {systemMetrics.total_teams || 0}
                    </div>
                    <div className="text-sm text-purple-800">Total Teams</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {systemMetrics.total_projects || 0}
                    </div>
                    <div className="text-sm text-orange-800">
                      Total Projects
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Team Performance
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Active Teams:</span>
                        <span className="font-semibold">
                          {systemMetrics.active_teams || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-semibold">
                          {systemMetrics.team_success_rate?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Lifecycle:</span>
                        <span className="font-semibold">
                          {systemMetrics.team_avg_lifecycle || 0} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Project Analytics
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span className="font-semibold">
                          {systemMetrics.project_completion_rate?.toFixed(1) ||
                            0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Duration:</span>
                        <span className="font-semibold">
                          {systemMetrics.avg_project_duration || 0} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Files:</span>
                        <span className="font-semibold">
                          {systemMetrics.project_files_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Distribution */}
                {systemMetrics.users_by_role && (
                  <div className="bg-white border rounded p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      User Distribution by Role
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {systemMetrics.users_by_role.map((role: any) => (
                        <div key={role.role} className="text-center">
                          <div className="text-xl font-bold text-blue-600">
                            {role.count}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {role.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No system metrics available. Try refreshing the page.
              </div>
            )}
          </div>
        ) : activeReport === "cross-entity" ? (
          // Cross-entity analytics dashboard
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6">
              Cross-Entity Analytics
            </h2>

            {crossEntityLoading ? (
              <PageSkeleton count={2} layout="card" />
            ) : crossEntityData ? (
              <div className="space-y-6">
                {/* Top Performing Teams */}
                {crossEntityData.top_performing_teams && (
                  <div className="bg-white border rounded p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Top Performing Teams
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Team Name</th>
                            <th className="text-center p-2">Projects</th>
                            <th className="text-center p-2">Completed</th>
                            <th className="text-center p-2">Success Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crossEntityData.top_performing_teams
                            .slice(0, 5)
                            .map((team: any) => (
                              <tr key={team.team_id} className="border-b">
                                <td className="p-2 text-gray-900">
                                  {team.team_name}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {team.total_projects}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {team.completed_projects}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {team.completion_rate.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Most Active Users */}
                {crossEntityData.most_active_users && (
                  <div className="bg-white border rounded p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Most Active Users
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">User</th>
                            <th className="text-center p-2">Activity Score</th>
                            <th className="text-center p-2">Teams</th>
                            <th className="text-center p-2">Files</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crossEntityData.most_active_users
                            .slice(0, 5)
                            .map((user: any) => (
                              <tr key={user.user_id} className="border-b">
                                <td className="p-2 text-gray-900">
                                  {user.name}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {user.activity_score}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {user.teams_count}
                                </td>
                                <td className="text-center p-2 text-gray-900">
                                  {user.files_uploaded}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No cross-entity analytics available. Try refreshing the page.
              </div>
            )}
          </div>
        ) : activeReport === "trends" ? (
          // Time series trends view
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6">
              Time Series Trends
            </h2>

            {timeSeriesLoading ? (
              <PageSkeleton count={1} layout="card" />
            ) : timeSeriesData?.series ? (
              <div className="space-y-6">
                <div className="flex gap-4 mb-4">
                  <select
                    value={filters.report_type}
                    onChange={(e) => {
                      handleFilterChange("report_type", e.target.value);
                      loadTimeSeriesData(e.target.value, "monthly");
                    }}
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  >
                    <option value="teams">Teams</option>
                    <option value="projects">Projects</option>
                    <option value="users">Users</option>
                    <option value="inventory_items">Inventory Items</option>
                    <option value="requests">Requests</option>
                    <option value="announcements">Announcements</option>
                    <option value="notifications">Notifications</option>
                    <option value="messages">Messages</option>
                  </select>
                  <select
                    value="monthly"
                    onChange={(e) =>
                      loadTimeSeriesData(filters.report_type, e.target.value)
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div className="h-96">
                  <Line
                    data={{
                      labels: timeSeriesData.series.map(
                        (item: any) => item.period
                      ),
                      datasets: [
                        {
                          label: `${
                            filters.report_type.charAt(0).toUpperCase() +
                            filters.report_type.slice(1)
                          } Growth`,
                          data: timeSeriesData.series.map(
                            (item: any) => item.value
                          ),
                          borderColor: "rgb(59, 130, 246)",
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `${context.parsed.y} ${filters.report_type}`,
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Count" },
                        },
                        x: {
                          title: { display: true, text: "Time Period" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No trend data available. Try adjusting your filters.
              </div>
            )}
          </div>
        ) : (
          // Advanced reports view
          <div className="space-y-6">
            {advancedLoading ? (
              <PageSkeleton count={2} layout="card" />
            ) : advancedData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {advancedData.total || 0}
                    </div>
                    <div className="text-sm text-blue-800">
                      Total {filters.report_type}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {advancedData[filters.report_type]?.filter(
                        (item: any) =>
                          item.status === "active" ||
                          item.metrics?.active_projects > 0
                      ).length || 0}
                    </div>
                    <div className="text-sm text-green-800">Active</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {advancedData[filters.report_type]?.filter(
                        (item: any) => item.status === "pending"
                      ).length || 0}
                    </div>
                    <div className="text-sm text-yellow-800">Pending</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {advancedData[filters.report_type]?.filter(
                        (item: any) => item.status === "completed"
                      ).length || 0}
                    </div>
                    <div className="text-sm text-purple-800">Completed</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded shadow overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-blue-900">
                      {filters.report_type.charAt(0).toUpperCase() +
                        filters.report_type.slice(1)}{" "}
                      Details
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    {advancedData[filters.report_type]?.length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {filters.report_type === "teams"
                                ? "Team Name"
                                : filters.report_type === "projects"
                                ? "Project Name"
                                : filters.report_type === "inventory"
                                ? "Item Name"
                                : filters.report_type === "users"
                                ? "User Name"
                                : "Name"}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            {filters.report_type === "teams" && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Members
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Projects
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Mentors
                                </th>
                              </>
                            )}
                            {filters.report_type === "projects" && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Team
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Progress
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Files
                                </th>
                              </>
                            )}
                            {filters.report_type === "inventory" && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Qty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Available
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Utilization
                                </th>
                              </>
                            )}
                            {filters.report_type === "users" && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Teams
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Files
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {advancedData[filters.report_type].map(
                            (item: any, index: number) => (
                              <tr
                                key={item.id || index}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.team_name ||
                                    item.name ||
                                    item.title ||
                                    "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      item.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : item.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : item.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {item.status || "N/A"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.created_at
                                    ? new Date(
                                        item.created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                {filters.report_type === "teams" && (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.member_count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.project_count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.mentor_count || 0}
                                    </td>
                                  </>
                                )}
                                {filters.report_type === "projects" && (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.team?.team_name || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.progress || 0}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.file_count || 0}
                                    </td>
                                  </>
                                )}
                                {filters.report_type === "inventory" && (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.total_quantity || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.available_quantity || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.utilization_rate || "0%"}
                                    </td>
                                  </>
                                )}
                                {filters.report_type === "users" && (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.role || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.teams_count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.metrics?.files_uploaded || 0}
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        No data available for the selected filters.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select filters and click "Apply Filters" to load data.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
