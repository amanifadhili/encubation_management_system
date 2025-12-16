import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import { getProject, getProjectFiles } from "../services/api";
import { useToast } from "../components/Layout";
import {
  RocketLaunchIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { getFileIcon } from "./Projects";

const displayStatusMap: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  completed: "Completed",
  on_hold: "On Hold",
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [project, setProject] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const loadProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getProject(id as unknown as number);
      const proj = res?.data?.project || res?.data || res;
      setProject(proj);
    } catch (err) {
      showToast("Failed to load project", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!id) return;
    try {
      setLoadingFiles(true);
      const res = await getProjectFiles(id as unknown as number);
      const projFiles = res?.data?.files || res?.data || res || [];
      setFiles(projFiles);
    } catch (err) {
      showToast("Failed to load files", "error");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadProject();
    loadFiles();
  }, [id]);

  if (loading || !project) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <PageSkeleton count={4} layout="stacked" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-b from-blue-50 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 font-semibold">
              <BuildingOffice2Icon className="w-4 h-4" />
              Project Overview
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                <TagIcon className="w-4 h-4" /> {project.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {project.team?.company_name || "Company"}
              </span>
              {project.team?.team_name && <span className="text-gray-500">• Team: {project.team.team_name}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                Enrolled: {formatDate(project.team?.enrollment_date || project.created_at)}
              </span>
            </div>
            <ButtonLoader
              loading={false}
              onClick={() => navigate("/projects")}
              label={
                <span className="flex items-center gap-2">
                  <ArrowLeftIcon className="w-4 h-4" /> Back
                </span>
              }
              variant="secondary"
              type="button"
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                {displayStatusMap[project.status] || project.status}
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-blue-900">{project.progress || 0}%</span>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Status at Enrollment</div>
            <div className="text-blue-900 font-semibold">
              {project.status_at_enrollment || "—"}
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Last Updated</div>
            <div className="text-blue-900 font-semibold">
              {formatDate(project.updated_at)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Basics */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
                <RocketLaunchIcon className="w-5 h-5" /> Project Basics
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-blue-900">
                <div>
                  <div className="text-sm text-gray-500">Project Name</div>
                  <div className="font-semibold">{project.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Company Name</div>
                  <div className="font-semibold">{project.team?.company_name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Team</div>
                  <div className="font-semibold">{project.team?.team_name || "-"}</div>
                </div>
                {project.status_at_enrollment && (
                  <div>
                    <div className="text-sm text-gray-500">Status at Enrollment</div>
                    <div className="font-semibold">{project.status_at_enrollment}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
                <DocumentTextIcon className="w-5 h-5" /> Project Details
              </div>
              <div className="space-y-4 text-blue-900">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Description</div>
                  <div className="bg-blue-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
                    {project.description || "-"}
                  </div>
                </div>
                {project.challenge_description && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Specific Challenge/Problem</div>
                    <div className="bg-blue-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
                      {project.challenge_description}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Category</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-blue-900 font-semibold">
                    <TagIcon className="w-4 h-4" />
                    {project.category}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
                <ChartBarIcon className="w-5 h-5" /> Status & Progress
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {displayStatusMap[project.status] || project.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Progress</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-blue-900">{project.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="text-blue-900 font-semibold text-lg">Project Files</div>
              {loadingFiles ? (
                <div className="text-blue-400">Loading files...</div>
              ) : files && files.length > 0 ? (
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-2xl">{getFileIcon(f.file_name || f.name, f.file_type || f.type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{f.file_name || f.name}</div>
                        {f.file_size && <div className="text-xs text-blue-600">{(f.file_size / 1024 / 1024).toFixed(2)} MB</div>}
                      </div>
                      {(f.file_path || f.url) && (
                        <a
                          href={f.file_path || f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                        >
                          View
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-blue-400 italic">No files uploaded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;

