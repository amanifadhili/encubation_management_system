import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { getCompanyReport } from "../services/api";

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

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {company.company_name || company.name || company.team_name || "Company"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {badge(company.status || "pending", "blue")}
              {company.rdb_registration_status && badge(company.rdb_registration_status, "emerald")}
              {company.enrollment_date && (
                <span className="text-slate-500">
                  Enrolled: {new Date(company.enrollment_date).toLocaleDateString()}
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

        {/* Mentor & Leader */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mentor</h3>
            {mentor ? (
              <div className="space-y-1 text-slate-700">
                <div className="font-semibold">{mentor.name || "-"}</div>
                <div>{mentor.email || "-"}</div>
                <div className="text-sm text-slate-500">{mentor.phone || "-"}</div>
                {mentor.assigned_at && (
                  <div className="text-xs text-slate-500">
                    Assigned: {new Date(mentor.assigned_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No mentor assigned</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Leader</h3>
            {company.leader ? (
              <div className="space-y-1 text-slate-700">
                <div className="font-semibold">{company.leader.name || "-"}</div>
                <div>{company.leader.email || "-"}</div>
                <div className="text-sm text-slate-500">{company.leader.phone || "-"}</div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No leader identified</div>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">Members</h3>
            <span className="text-xs text-slate-500">{members.length} members</span>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Department</th>
                  <th className="px-3 py-2 text-left">Grad Year</th>
                  <th className="px-3 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{m.name || "-"}</td>
                    <td className="px-3 py-2">{m.email || "-"}</td>
                    <td className="px-3 py-2">{m.phone || "-"}</td>
                    <td className="px-3 py-2">{m.department || "-"}</td>
                    <td className="px-3 py-2">{m.graduation_year || "-"}</td>
                    <td className="px-3 py-2 text-xs">{m.role || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 ? (
              <div className="text-center text-slate-500 py-4">No members</div>
            ) : null}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
            <span className="text-xs text-slate-500">{projects.length} projects</span>
          </div>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    {badge(p.status || "-", "blue")}
                  </div>
                  <div className="text-xs text-slate-600">{p.category}</div>
                  <div className="text-xs text-slate-600">Enroll: {p.status_at_enrollment || "-"}</div>
                  <div className="text-xs text-slate-600">Progress: {p.progress != null ? `${p.progress}%` : "-"}</div>
                  {p.files && p.files.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <div className="text-xs font-semibold text-slate-700">Files</div>
                      <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                        {p.files.map((f: any) => (
                          <li key={f.id}>
                            <a className="text-blue-600 hover:underline" href={f.path} target="_blank" rel="noreferrer">
                              {f.name}
                            </a>{" "}
                            {f.type ? `(${f.type})` : ""} {f.size ? `- ${(f.size / 1024 / 1024).toFixed(2)} MB` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-4">No projects</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyReport;

