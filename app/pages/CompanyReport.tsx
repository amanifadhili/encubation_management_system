import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { getCompanyReport } from "../services/api";
import {
  ReportHeader,
  ProfessionalTable,
  ReportContainer,
  ExportButtons,
  ReportSignatures,
  type TableColumn,
} from "../components/reports";
import { useReportExport } from "../hooks/useReportExport";
import { formatDate } from "../utils/formatters";

const COMPANY_NAME = "INCUBATION MANAGEMENT SYSTEM";

const badge = (text: string, color = "blue") => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-${color}-50 text-${color}-700`}
  >
    {text}
  </span>
);

const CompanyReport: React.FC = () => {
  const { id } = useParams();
  const showToast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCompanyReport(id);
      const payload = (res as any)?.data ?? res;
      const normalized = payload?.data ?? payload;
      setData({
        company: normalized.company ?? normalized.team ?? {},
        mentor: normalized.mentor ?? null,
        members: normalized.members ?? [],
        projects: normalized.projects ?? [],
      });
    } catch (error: any) {
      showToast("Failed to load company report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Export functionality
  const exportControls = useReportExport({
    exportElementId: "company-report-export",
    filename: `company-report-${id}`,
    showToast,
    pdfOptions: {
      orientation: "portrait",
      hideColumns: [],
    },
    excelOptions: {
      includeHeader: true,
    },
  });

  // Calculate date range for report header
  const dateRange = useMemo(() => {
    const company = data?.company || {};
    if (company.enrollment_date) {
      const enrollDate = new Date(company.enrollment_date);
      return {
        start: enrollDate,
        end: new Date(), // Current date
      };
    }
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="p-4 sm:p-8">
        <PageSkeleton count={3} layout="stacked" />
      </div>
    );
  }

  const company = data.company || {};
  const mentor = data.mentor;
  const members = data.members || [];
  const projects = data.projects || [];

  const companyName =
    company.company_name || company.name || company.team_name || "Company";

  // Prepare members table data
  const membersTableData = useMemo(() => {
    return members.map((m: any) => ({
      name: m.name || "-",
      email: m.email || "-",
      phone: m.phone || "-",
      department: m.department || "-",
      graduationYear: m.graduation_year || "-",
      role: m.role || "-",
    }));
  }, [members]);

  // Members table columns
  const membersColumns: TableColumn[] = [
    { key: "name", label: "Name", align: "left" },
    { key: "email", label: "Email", align: "left" },
    { key: "phone", label: "Phone", align: "left" },
    { key: "department", label: "Department", align: "left" },
    { key: "graduationYear", label: "Graduation Year", align: "left" },
    { key: "role", label: "Role", align: "left" },
  ];

  // Prepare projects table data
  const projectsTableData = useMemo(() => {
    return projects.map((p: any) => ({
      name: p.name || "-",
      category: p.category || "-",
      status: p.status || "-",
      statusAtEnrollment: p.status_at_enrollment || "-",
      progress: p.progress != null ? `${p.progress}%` : "-",
      filesCount: p.files && p.files.length > 0 ? p.files.length : 0,
    }));
  }, [projects]);

  // Projects table columns
  const projectsColumns: TableColumn[] = [
    { key: "name", label: "Project Name", align: "left" },
    { key: "category", label: "Category", align: "left" },
    { key: "status", label: "Current Status", align: "left" },
    { key: "statusAtEnrollment", label: "Status at Enrollment", align: "left" },
    { key: "progress", label: "Progress", align: "right" },
    { key: "filesCount", label: "Files", align: "right" },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between no-print">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {companyName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {badge(company.status || "pending", "blue")}
              {company.rdb_registration_status &&
                badge(company.rdb_registration_status, "emerald")}
              {company.enrollment_date && (
                <span className="text-gray-500">
                  Enrolled: {formatDate(company.enrollment_date, "short")}
                </span>
              )}
            </div>
          </div>
          <ButtonLoader
            loading={false}
            onClick={() => navigate("/reports")}
            label="Back to Reports"
            variant="secondary"
            size="sm"
          />
        </div>

        {/* Report Container */}
        <ReportContainer exportId="company-report-export">
          {/* Export Buttons */}
          <div className="flex justify-end mb-4 no-print">
            <ExportButtons
              exportElementId="company-report-export"
              onPrint={exportControls.printReport}
              onPdf={exportControls.exportPDF}
              onExcel={exportControls.exportExcel}
              loading={exportControls.loading}
            />
          </div>

          {/* Report Header */}
          <ReportHeader
            companyName={COMPANY_NAME}
            reportTitle="Company Report"
            dateRange={dateRange}
            reportType={companyName}
          />

          {/* Company Information Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Mentor</h4>
              {mentor ? (
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="font-semibold">{mentor.name || "-"}</div>
                  <div>{mentor.email || "-"}</div>
                  <div className="text-xs text-gray-500">{mentor.phone || "-"}</div>
                  {mentor.assigned_at && (
                    <div className="text-xs text-gray-500">
                      Assigned: {formatDate(mentor.assigned_at, "short")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No mentor assigned</div>
              )}
            </div>

            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Team Leader</h4>
              {company.leader ? (
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="font-semibold">{company.leader.name || "-"}</div>
                  <div>{company.leader.email || "-"}</div>
                  <div className="text-xs text-gray-500">{company.leader.phone || "-"}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No leader identified</div>
              )}
            </div>
          </div>

          {/* Members Section */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Team Members ({members.length})
            </h3>
            <ProfessionalTable
              columns={membersColumns}
              data={membersTableData}
              showRowNumbers={true}
              textSize="xs"
              padding="compact"
              emptyMessage="No members"
            />
          </div>

          {/* Projects Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Projects ({projects.length})
            </h3>
            {projects.length > 0 ? (
              <ProfessionalTable
                columns={projectsColumns}
                data={projectsTableData}
                showRowNumbers={true}
                textSize="xs"
                padding="compact"
                emptyMessage="No projects"
              />
            ) : (
              <div className="text-center text-gray-500 py-4">No projects</div>
            )}
          </div>

          {/* Signatures */}
          <ReportSignatures
            signatures={[
              { label: "Prepared by" },
              { label: "Review and Approved" },
            ]}
          />
        </ReportContainer>
      </div>
    </div>
  );
};

export default CompanyReport;
