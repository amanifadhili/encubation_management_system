import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Layout";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { ErrorHandler } from "../utils/errorHandler";
import { getGeneralReport, exportGeneralReportCsv } from "../services/api";

const Reports = () => {
  const showToast = useToast();

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

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">General Report</h1>
              <p className="text-sm text-slate-600">
                Combined companies, projects, mentors — filter and export CSV.
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
                <label className="block text-xs font-semibold text-slate-600">Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters((p: any) => ({ ...p, date_from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters((p: any) => ({ ...p, date_to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((p: any) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Category / Field</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((p: any) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Team Status</label>
                <select
                  value={filters.team_status}
                  onChange={(e) => setFilters((p: any) => ({ ...p, team_status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {teamStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">RDB Registration</label>
                <select
                  value={filters.rdb_registration_status}
                  onChange={(e) =>
                    setFilters((p: any) => ({ ...p, rdb_registration_status: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  {rdbOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Progress Min (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.progress_min}
                  onChange={(e) => setFilters((p: any) => ({ ...p, progress_min: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Progress Max (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.progress_max}
                  onChange={(e) => setFilters((p: any) => ({ ...p, progress_max: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Enrollment From</label>
                <input
                  type="date"
                  value={filters.enrollment_from}
                  onChange={(e) => setFilters((p: any) => ({ ...p, enrollment_from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Enrollment To</label>
                <input
                  type="date"
                  value={filters.enrollment_to}
                  onChange={(e) => setFilters((p: any) => ({ ...p, enrollment_to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Results</h3>
              <p className="text-sm text-slate-600">Record count: {groupedRows.length}</p>
            </div>
            <ButtonLoader
              loading={loading}
              onClick={load}
              label="Refresh"
              loadingText="Loading..."
              variant="secondary"
              size="sm"
            />
          </div>

          {loading ? (
            <PageSkeleton count={2} layout="table" />
          ) : groupedRows.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No data. Adjust filters and try again.</div>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm bg-white text-slate-900">
                <thead className="bg-slate-100 text-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left">S/N</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">RDB</th>
                    <th className="px-3 py-2 text-left">Enrollment Date</th>
                    <th className="px-3 py-2 text-left">Team Status</th>
                    <th className="px-3 py-2 text-left">Mentor</th>
                    <th className="px-3 py-2 text-left">Mentor Contact</th>
                    <th className="px-3 py-2 text-left">Innovator</th>
                    <th className="px-3 py-2 text-left">Contacts</th>
                    <th className="px-3 py-2 text-left">Department</th>
                    <th className="px-3 py-2 text-left">Planned Graduation</th>
                    <th className="px-3 py-2 text-left">Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {groupedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 text-slate-800 align-top">
                      <td className="px-3 py-3">{idx + 1}</td>
                      <td className="px-3 py-3 font-semibold">{row.company}</td>
                      <td className="px-3 py-3 text-slate-800">{row.rdb}</td>
                      <td className="px-3 py-3">
                        {row.enrollmentDate ? new Date(row.enrollmentDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-800">{row.teamStatus}</td>
                      <td className="px-3 py-3 text-slate-800">{row.mentorName}</td>
                      <td className="px-3 py-3">
                        <div className="text-slate-800">{row.mentorContact || "-"}</div>
                        {row.mentorAssignmentDate && (
                          <div className="text-xs text-slate-500">
                            Assigned: {new Date(row.mentorAssignmentDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{row.innovator}</div>
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        <div className="text-slate-800">{row.email}</div>
                        <div className="text-slate-600 text-xs">{row.phone}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{row.department}</td>
                      <td className="px-3 py-3 text-slate-800">{row.plannedGraduation}</td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          {row.projects.map((p, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center sm:gap-2 rounded-lg bg-slate-50 border border-slate-200 px-2 py-1"
                            >
                              <div className="font-semibold text-slate-900">{p.title}</div>
                              <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                                <span>{p.field}</span>
                                <span>· Status: {p.currentStatus}</span>
                                {p.statusAtEnroll !== "-" && <span>· Enroll: {p.statusAtEnroll}</span>}
                                {p.progress != null && <span>· {p.progress}%</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
