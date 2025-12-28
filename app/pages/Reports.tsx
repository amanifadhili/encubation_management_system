import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { ErrorHandler } from "../utils/errorHandler";
import { getGeneralReport, exportGeneralReportCsv } from "../services/api";
import {
  ReportHeader,
  ProfessionalTable,
  ReportContainer,
  ExportButtons,
  ReportSignatures,
  type TableColumn,
} from "../components/reports";
import { useReportExport } from "../hooks/useReportExport";
import { formatDate, formatCurrency } from "../utils/formatters";
import {
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const COMPANY_NAME = "INCUBATION MANAGEMENT SYSTEM";

const Reports = () => {
  const showToast = useToast();
  const navigate = useNavigate();

  const statusOptions = ["", "active", "pending", "completed", "on_hold", "inactive"];
  const categoryOptions = [
    "",
    "Technology",
    "Agriculture",
    "Health",
    "Education",
    "Design",
    "SocialImpact",
    "Sustainability",
    "AgriTech",
    "HealthTech",
    "EdTech",
    "RoboticsAI",
    "FinTech",
    "OpenToAny",
    "Other",
  ];
  const teamStatusOptions = ["", "active", "pending", "inactive"];
  const rdbOptions = ["", "Registered", "Pending", "Not Registered"];

  const [filters, setFilters] = useState<any>({
    status: "",
    category: "",
    team_status: "",
    rdb_registration_status: "",
    date_from: "",
    date_to: "",
    progress_min: "",
    progress_max: "",
    enrollment_from: "",
    enrollment_to: "",
  });
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Calculate date range for report header
  const dateRange = useMemo(() => {
    const start = filters.date_from || filters.enrollment_from;
    const end = filters.date_to || filters.enrollment_to;
    if (start && end) {
      return {
        start: new Date(start),
        end: new Date(end),
      };
    }
    // Default to current month if no dates specified
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }, [filters.date_from, filters.date_to, filters.enrollment_from, filters.enrollment_to]);

  // Export functionality
  const exportControls = useReportExport({
    exportElementId: "general-report-export",
    filename: "general-report",
    showToast,
    pdfOptions: {
      orientation: "landscape",
      hideColumns: [],
    },
    excelOptions: {
      includeHeader: true,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGeneralReport(filters);
      const items = data?.data?.rows || data?.rows || [];
      setRows(items);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading general report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const response = await exportGeneralReportCsv(filters);
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
      setExporting(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        company: string;
        innovator: string;
        email: string;
        phone: string;
        department: string;
        plannedGraduation: string;
        teamStatus: string;
        rdb: string;
        enrollmentDate?: string | null;
        mentorName: string;
        mentorContact: string;
        mentorAssignmentDate?: string | null;
        projects: {
          title: string;
          field: string;
          statusAtEnroll: string;
          currentStatus: string;
          progress: number | null | undefined;
          createdAt?: string | null;
          updatedAt?: string | null;
        }[];
        teamId?: string;
      }
    >();

    rows.forEach((r) => {
      const key = (r.company_name || "Unknown Company").trim();
      if (!map.has(key)) {
        map.set(key, {
          company: r.company_name || "Unknown Company",
          innovator: r.innovator_name || "-",
          email: r.innovator_email || "-",
          phone: r.innovator_phone || "-",
          department: r.department || "-",
          plannedGraduation: r.planned_graduation_date || "-",
          teamStatus: r.team_status || "-",
          rdb: r.rdb_registration_status || "-",
          enrollmentDate: r.enrollment_date || null,
          mentorName: r.mentor_name || "-",
          mentorContact: r.mentor_contact || "-",
          mentorAssignmentDate: r.mentor_assignment_date || null,
          projects: [],
          teamId: r.team_id,
        });
      }
      const grp = map.get(key)!;
      const projKey = `${r.project_title || "-"}|${r.project_field || "-"}|${
        r.current_status || "-"
      }|${r.status_at_enrollment || "-"}`;
      const exists = grp.projects.find(
        (p) =>
          `${p.title}|${p.field}|${p.currentStatus}|${p.statusAtEnroll}` === projKey &&
          (p.progress ?? null) === (r.progress ?? null) &&
          (p.createdAt ?? null) === (r.project_created_at ?? null) &&
          (p.updatedAt ?? null) === (r.project_updated_at ?? null)
      );
      if (!exists) {
        grp.projects.push({
          title: r.project_title || "-",
          field: r.project_field || "-",
          statusAtEnroll: r.status_at_enrollment || "-",
          currentStatus: r.current_status || "-",
          progress: r.progress,
          createdAt: r.project_created_at || null,
          updatedAt: r.project_updated_at || null,
        });
      }
    });

    return Array.from(map.values());
  }, [rows]);

  // Prepare table data
  const tableData = useMemo(() => {
    return groupedRows.map((row) => ({
      company: row.company,
      rdb: row.rdb,
      enrollmentDate: row.enrollmentDate
        ? formatDate(row.enrollmentDate, "short")
        : "-",
      teamStatus: row.teamStatus,
      mentorName: row.mentorName,
      mentorContact: row.mentorContact,
      innovator: row.innovator,
      email: row.email,
      phone: row.phone,
      department: row.department,
      plannedGraduation: row.plannedGraduation,
      projectsCount: row.projects.length,
      projects: row.projects.map((p) => p.title).join(", "),
      teamId: row.teamId,
    }));
  }, [groupedRows]);

  // Table columns definition
  const columns: TableColumn[] = [
    { key: "company", label: "Company", align: "left" },
    { key: "rdb", label: "RDB", align: "left" },
    { key: "enrollmentDate", label: "Enrollment Date", align: "left" },
    { key: "teamStatus", label: "Team Status", align: "left" },
    { key: "mentorName", label: "Mentor", align: "left" },
    { key: "mentorContact", label: "Mentor Contact", align: "left" },
    { key: "innovator", label: "Innovator", align: "left" },
    { key: "email", label: "Email", align: "left" },
    { key: "phone", label: "Phone", align: "left" },
    { key: "department", label: "Department", align: "left" },
    { key: "plannedGraduation", label: "Planned Graduation", align: "left" },
    { key: "projectsCount", label: "Projects Count", align: "right" },
  ];

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ChartBarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Looking for analytics and insights?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Visit the <button onClick={() => navigate("/analytics")} className="underline font-semibold hover:text-blue-900">Analytics Hub</button> for inventory, request, consumption, and replenishment analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6 no-print">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                General Report
              </h1>
              <p className="text-sm text-gray-600">
                Combined companies, projects, mentors — filter and export.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ButtonLoader
                loading={false}
                onClick={() => setShowFilters((v) => !v)}
                label={showFilters ? "Hide Filters" : "Show Filters"}
                variant="outline"
                size="md"
              />
              <ButtonLoader
                loading={loading}
                onClick={load}
                label="Apply Filters"
                loadingText="Loading..."
                variant="primary"
                size="md"
              />
              <ButtonLoader
                loading={exporting}
                onClick={downloadCsv}
                label="Download CSV"
                loadingText="Downloading..."
                variant="secondary"
                size="md"
              />
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters((p: any) => ({ ...p, date_from: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters((p: any) => ({ ...p, date_to: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((p: any) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Category / Field
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((p: any) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Team Status
                </label>
                <select
                  value={filters.team_status}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      team_status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {teamStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  RDB Registration
                </label>
                <select
                  value={filters.rdb_registration_status}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      rdb_registration_status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {rdbOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Progress Min (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.progress_min}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      progress_min: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Progress Max (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.progress_max}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      progress_max: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Enrollment From
                </label>
                <input
                  type="date"
                  value={filters.enrollment_from}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      enrollment_from: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Enrollment To
                </label>
                <input
                  type="date"
                  value={filters.enrollment_to}
                  onChange={(e) =>
                    setFilters((p: any) => ({
                      ...p,
                      enrollment_to: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Report Container */}
        <ReportContainer exportId="general-report-export">
          {/* Export Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 no-print">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              <p className="text-sm text-gray-600">
                Record count: {groupedRows.length}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center mt-2 md:mt-0">
              <ButtonLoader
                loading={loading}
                onClick={load}
                label="Refresh"
                loadingText="Loading..."
                variant="secondary"
                size="sm"
              />
              <ExportButtons
                exportElementId="general-report-export"
                onPrint={exportControls.printReport}
                onPdf={exportControls.exportPDF}
                onExcel={exportControls.exportExcel}
                loading={exportControls.loading}
              />
            </div>
          </div>

          {loading ? (
            <PageSkeleton count={2} layout="table" />
          ) : groupedRows.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              No data. Adjust filters and try again.
            </div>
          ) : (
            <>
              {/* Report Header */}
              <ReportHeader
                companyName={COMPANY_NAME}
                reportTitle="General Report"
                dateRange={dateRange}
                reportType="Companies, Projects & Mentors Overview"
              />

              {/* Professional Table */}
              <ProfessionalTable
                columns={columns}
                data={tableData}
                showRowNumbers={true}
                textSize="xs"
                padding="compact"
                emptyMessage="No data available"
                renderCell={(column, value, row, index) => {
                  // Make company name clickable in web view (clicks won't work in exports, which is fine)
                  if (column.key === "company" && row.teamId) {
                    return (
                      <span
                        className="font-semibold text-blue-700 cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company-report/${row.teamId}`);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {String(value)}
                      </span>
                    );
                  }
                  return value;
                }}
              />

              {/* Signatures */}
              <ReportSignatures
                signatures={[
                  { label: "Prepared by" },
                  { label: "Review and Approved" },
                ]}
              />
            </>
          )}
        </ReportContainer>
      </div>
    </div>
  );
};

export default Reports;
