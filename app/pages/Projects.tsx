import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ValidationErrors } from "../components/ValidationErrors";
import type { ValidationError } from "../components/ValidationErrors";
import { FormField } from "../components/FormField";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectFiles,
  getProjectFiles,
  getIncubators
} from "../services/api";
import { ProjectBasicsForm, ProjectDetailsForm } from "../components/profile";
import { RocketLaunchIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const categories = ["All", "Technology", "Agriculture", "Health", "Education"];
const statusOptions = ["All", "Active", "Pending", "Completed", "On Hold"];

// Map display status to backend status values
const statusMap: Record<string, string> = {
  "Active": "active",
  "Pending": "pending",
  "Completed": "completed",
  "On Hold": "on_hold",
  "active": "active",
  "pending": "pending",
  "completed": "completed",
  "on_hold": "on_hold"
};

// Map backend status to display status
const displayStatusMap: Record<string, string> = {
  "active": "Active",
  "pending": "Pending",
  "completed": "Completed",
  "on_hold": "On Hold"
};

function getFileUrl(file: File) {
  return URL.createObjectURL(file);
}

export function getFileIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  if (['xls', 'xlsx'].includes(ext || '')) return '📊';
  if (['ppt', 'pptx'].includes(ext || '')) return '📽️';
  if (ext === 'txt') return '📄';
  return '📎';
}

const Projects = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const isManager = user?.role === "manager";
  const isDirector = user?.role === "director";
  const isMentor = user?.role === "mentor";
  const isIncubator = user?.role === "incubator";
  const teamId = isIncubator ? (user as any).teamId : null;

  // State for projects and loading
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'basics' | 'details'>('basics');
  const [form, setForm] = useState({
    // Basic fields
    name: "",
    status_at_enrollment: "",
    // Detail fields
    description: "",
    challenge_description: "",
    category: categories[1],
    // Existing fields
    status: statusOptions[1],
    progress: 0,
    files: [] as File[],
  });
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [comments, setComments] = useState<{ [projectId: number]: { name: string; text: string; date: string }[] }>({});
  const [commentText, setCommentText] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<{ [projectId: number]: any[] }>({});
  
  // Loading states for different operations
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  
  // Validation error state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Load projects and teams on mount
  useEffect(() => {
    if (user) {
      loadProjects();
      loadTeams();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await withRetry(
        () => getProjects(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, delay) => {
            showToast(`Retrying... (Attempt ${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setProjects(data);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      const errorDetails = ErrorHandler.parse(error);
      
      if (ErrorHandler.isTimeout(error)) {
        showToast('Request timed out. Please try again.', 'error');
      } else if (ErrorHandler.isServiceUnavailable(error)) {
        showToast('Service temporarily unavailable. Please try again later.', 'error');
      } else {
        showToast(errorDetails.userMessage || 'Failed to load projects', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await withRetry(() => getIncubators(), { maxRetries: 2 });
      setTeams(data.map((team: any) => ({ id: team.id, teamName: team.team_name })));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading teams');
      setTeams([]);
    }
  };

  const loadProjectFiles = async (projectId: number) => {
    try {
      const files = await getProjectFiles(projectId);
      setProjectFiles(prev => ({ ...prev, [projectId]: files }));
    } catch (error: any) {
      // Silent for 404 (no files) and network errors (not critical)
      if (!ErrorHandler.isNotFound(error) && !ErrorHandler.isNetworkError(error)) {
        ErrorHandler.handleError(error, showToast, 'loading project files');
      }
    }
  };

  // Filtered projects
  let filteredProjects = projects;
  if (isIncubator) {
    filteredProjects = projects.filter(p => p.team_id === teamId);
  }
  // Search filter
  filteredProjects = filteredProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );
  // Category filter
  if (categoryFilter !== "All") {
    filteredProjects = filteredProjects.filter(p => p.category === categoryFilter);
  }
  // Status filter - convert display status to backend status for comparison
  if (statusFilter !== "All") {
    const backendStatus = statusMap[statusFilter] || statusFilter.toLowerCase();
    filteredProjects = filteredProjects.filter(p => {
      const projectStatus = typeof p.status === 'string' ? p.status.toLowerCase() : p.status;
      return projectStatus === backendStatus || projectStatus === statusFilter.toLowerCase();
    });
  }

  // Load project files when viewing a project
  useEffect(() => {
    if (viewIdx !== null && filteredProjects[viewIdx]) {
      const projectId = filteredProjects[viewIdx].id;
      if (!projectFiles[projectId]) {
        loadProjectFiles(projectId);
      }
    }
  }, [viewIdx, filteredProjects, projectFiles]);

  // Add/Edit modal
  const openModal = (idx: number | null = null) => {
    setEditIdx(idx);
    setActiveSection('basics'); // Reset to basics section
    if (idx !== null) {
      const p = filteredProjects[idx];
      setForm({
        name: p.name,
        status_at_enrollment: p.status_at_enrollment || "",
        description: p.description || "",
        challenge_description: p.challenge_description || "",
        category: p.category,
        status: displayStatusMap[p.status] || p.status, // Convert backend status to display status
        progress: p.progress || 0,
        files: p.files || [],
      });
    } else {
      setForm({
        name: "",
        status_at_enrollment: "",
        description: "",
        challenge_description: "",
        category: categories[1],
        status: statusOptions[1],
        progress: 0,
        files: []
      });
    }
    setShowModal(true);
  };

  // Handle basics section save
  const handleBasicsSave = (data: {
    name: string;
    status_at_enrollment: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      ...data,
    }));
    setActiveSection('details');
  };

  // Handle details section save
  const handleDetailsSave = (data: {
    description: string;
    challenge_description: string;
    category: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      ...data,
    }));
    // Auto-submit after details are saved
    handleSaveProject();
  };

  // Save add/edit
  const handleSaveProject = async () => {
    // Validate required fields
    if (!form.name || !form.description || !form.status_at_enrollment || !form.challenge_description || !form.category) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    setUploadError(null);
    setValidationErrors([]);
    setSubmitting(true);
    
    try {
      let result: any;
      if (editIdx !== null) {
        const projectId = filteredProjects[editIdx].id;
        result =         await updateProject(projectId, {
          name: form.name,
          description: form.description,
          category: form.category,
          status: statusMap[form.status] || form.status.toLowerCase(),
          progress: form.progress,
          status_at_enrollment: form.status_at_enrollment || undefined,
          challenge_description: form.challenge_description || undefined,
        });

        // Upload files if any
        if (form.files.length > 0) {
          setUploading(true);
          setUploadProgress(0);
          const formData = new FormData();
          form.files.forEach(file => formData.append('files', file));
          await uploadProjectFiles(projectId, formData, (progress) => {
            setUploadProgress(progress);
          });
          setUploading(false);
        }

        // Extract project from response
        const updatedProject = result.data?.project || result;
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        showToast('Project updated successfully!', 'success');
      } else {
        result = await createProject({
          name: form.name,
          description: form.description,
          category: form.category,
          status: statusMap[form.status] || form.status.toLowerCase(),
          progress: form.progress,
          status_at_enrollment: form.status_at_enrollment || undefined,
          challenge_description: form.challenge_description || undefined,
        });

        // Extract project from response
        const project = result.data?.project || result;
        const projectId = project.id;

        // Upload files if any
        if (form.files.length > 0 && projectId) {
          setUploading(true);
          setUploadProgress(0);
          const formData = new FormData();
          form.files.forEach(file => formData.append('files', file));
          await uploadProjectFiles(projectId, formData, (progress) => {
            setUploadProgress(progress);
          });
          setUploading(false);
        }

        setProjects(prev => [...prev, project]);
        showToast('Project created successfully!', 'success');
      }
      setShowModal(false);
      setEditIdx(null);
      setActiveSection('basics');
      setForm({
        name: "",
        status_at_enrollment: "",
        description: "",
        challenge_description: "",
        category: categories[1],
        status: statusOptions[1],
        progress: 0,
        files: []
      });
      setValidationErrors([]);
      setTouchedFields(new Set());
    } catch (error: any) {
      console.error('Failed to save project:', error);
      const errorDetails = error.errorDetails;
      
      // Handle 422 - Business Logic Errors
      if (ErrorHandler.isUnprocessableEntity(error)) {
        const businessError = ErrorHandler.parseBusinessLogicError(errorDetails);
        showToast(businessError.message, 'warning');
        
        // Highlight the problematic field if specified
        if (businessError.field) {
          setFocusedField(businessError.field);
          setTouchedFields(prev => {
            const newSet = new Set(prev);
            if (businessError.field) newSet.add(businessError.field);
            return newSet;
          });
        }
      }
      // Handle 413 - File Too Large
      else if (ErrorHandler.isPayloadTooLarge(error)) {
        const sizeError = ErrorHandler.parseFileSizeError(errorDetails);
        showToast(sizeError.message, 'error');
        setUploadError(sizeError.message);
      }
      // Handle 400 - Validation Errors
      else if (errorDetails?.status === 400) {
        const errors = ErrorHandler.parseValidationErrors(errorDetails);
        setValidationErrors(errors);
        
        // Focus first error field
        if (errors.length > 0) {
          setFocusedField(errors[0].field);
        }
        
        showToast(errorDetails.userMessage, 'error');
      }
      // Handle other errors
      else {
        setUploadError(errorDetails?.userMessage || 'Failed to save project');
        showToast(errorDetails?.userMessage || 'Failed to save project', 'error');
      }
      
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Update progress (incubator only)
  const handleProgress = (idx: number, value: number) => {
    const projId = filteredProjects[idx].id;
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, progress: value } : p));
  };

  // Handle field focus for error clicking
  const handleFieldFocus = (field: string) => {
    setFocusedField(field);
    setTouchedFields(prev => new Set(prev).add(field));
  };

  // Get error for specific field
  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  // Mark field as touched
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  // Handle file upload (real)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setForm(f => ({ ...f, files: [...f.files, ...newFiles] }));
  };
  const handleRemoveFile = (file: File) => {
    setForm(f => ({ ...f, files: f.files.filter((fObj: File) => fObj !== file) }));
  };

  // Comments
  const handleAddComment = async (projectId: number) => {
    if (!commentText.trim() || !user) return;
    
    setCommenting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setComments(prev => ({
        ...prev,
        [projectId]: [
          { name: user.name, text: commentText, date: new Date().toLocaleString() },
          ...(prev[projectId] || []),
        ],
      }));
      setCommentText("");
      showToast('Comment added successfully!', 'success');
    } catch (error) {
      showToast('Failed to add comment', 'error');
    } finally {
      setCommenting(false);
    }
  };

  // Table columns: Project Name, Team, Category, Status, Progress, Actions
  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Projects</h1>
            <div className="text-white opacity-90 mb-2">Manage and track team projects and progress.</div>
          </div>
          {isIncubator && (
            <ButtonLoader
              loading={false}
              onClick={() => openModal(null)}
              label="+ Add Project"
              variant="primary"
              className="bg-blue-700 hover:bg-blue-800"
            />
          )}
        </div>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Project List</h2>
          {loading ? (
            <PageSkeleton count={6} layout="table" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-blue-900">Project Name</th>
                    <th className="px-4 py-2 text-left text-blue-900">Team</th>
                    <th className="px-4 py-2 text-left text-blue-900">Category</th>
                    <th className="px-4 py-2 text-left text-blue-900">Status</th>
                    <th className="px-4 py-2 text-left text-blue-900">Progress</th>
                    <th className="px-4 py-2 text-left text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-blue-400">No projects found.</td>
                    </tr>
                  ) : (
                    filteredProjects.map((p, idx) => {
                        const team = teams.find(t => t.id === p.team_id);
                        return (
                          <tr key={p.id} className="border-b hover:bg-blue-50 transition">
                            <td className="px-4 py-2 text-blue-900 font-semibold">{p.name}</td>
                            <td className="px-4 py-2 text-blue-900">{team ? team.teamName : "-"}</td>
                            <td className="px-4 py-2 text-blue-900">{p.category}</td>
                            <td className="px-4 py-2 text-blue-900">{displayStatusMap[p.status] || p.status}</td>
                            <td className="px-4 py-2 text-blue-900">
                              {isIncubator ? (
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={p.progress || 0}
                                  onChange={e => handleProgress(idx, Number(e.target.value))}
                                  className="w-32"
                                />
                              ) : (
                                <span>{p.progress || 0}%</span>
                              )}
                            </td>
                            <td className="px-4 py-2 flex gap-2">
                              <button
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                onClick={() => navigate(`/projects/${p.id}`)}
                              >View</button>
                              {isIncubator && (
                                <button
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  onClick={() => openModal(idx)}
                                >Edit</button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Add/Edit Modal */}
        <Modal
          title={editIdx !== null ? "Edit Project" : "Add Project"}
          open={showModal}
          onClose={() => { 
            setShowModal(false); 
            setEditIdx(null); 
            setActiveSection('basics');
            setValidationErrors([]); 
            setTouchedFields(new Set()); 
          }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <ValidationErrors 
            errors={validationErrors} 
            onFieldFocus={handleFieldFocus}
          />

          {/* Section Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSection('basics')}
              className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                activeSection === 'basics'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : form.name && form.status_at_enrollment
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <RocketLaunchIcon className="w-5 h-5" />
                <span className="font-medium whitespace-nowrap">Project Basics</span>
                {form.name && form.status_at_enrollment && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (form.name && form.status_at_enrollment) {
                  setActiveSection('details');
                }
              }}
              disabled={!form.name || !form.status_at_enrollment}
              className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                activeSection === 'details'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : form.description && form.challenge_description && form.category
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : form.name && form.status_at_enrollment
                  ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                <span className="font-medium whitespace-nowrap">Project Details</span>
                {form.description && form.challenge_description && form.category && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Form Sections */}
          {activeSection === 'basics' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Project Basics
                </h3>
                <p className="text-sm text-gray-600">
                  Provide basic information about your project.
                </p>
              </div>
              <ProjectBasicsForm
                initialData={{
                  name: form.name,
                  status_at_enrollment: form.status_at_enrollment,
                }}
                onSave={handleBasicsSave}
                onNext={() => {
                  if (form.name && form.status_at_enrollment) {
                    setActiveSection('details');
                  }
                }}
              />
            </div>
          )}

          {activeSection === 'details' && (
            <div>
              {(!form.name || !form.status_at_enrollment) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please complete the Project Basics section first.
                  </p>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Project Details
                </h3>
                <p className="text-sm text-gray-600">
                  Describe your project in detail and specify the problem you're solving.
                </p>
              </div>
              <ProjectDetailsForm
                initialData={{
                  description: form.description,
                  challenge_description: form.challenge_description,
                  category: form.category,
                }}
                onSave={handleDetailsSave}
                onSubmit={handleSaveProject}
              />
            </div>
          )}

          {/* Additional Fields (Status, Progress) - Show in details section */}
          {activeSection === 'details' && (
            <div className="mt-6 space-y-4 border-t pt-6">
              <FormField
                label="Status"
                name="status"
                error={getFieldError('status')}
                touched={touchedFields.has('status')}
              >
                <select
                  id="status"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  onBlur={() => handleFieldBlur('status')}
                  disabled={submitting || uploading}
                >
                  {statusOptions.slice(1).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              
              <FormField
                label="Progress (%)"
                name="progress"
                error={getFieldError('progress')}
                touched={touchedFields.has('progress')}
                helperText="Enter a value between 0 and 100"
              >
                <input
                  id="progress"
                  type="number"
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  value={form.progress}
                  onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                  onBlur={() => handleFieldBlur('progress')}
                  disabled={submitting || uploading}
                />
              </FormField>

              {/* File upload (real) */}
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Files (images, pdf, doc, etc.)</label>
                <input
                  type="file"
                  multiple
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  disabled={submitting || uploading}
                />
                {uploading && (
                  <div className="mt-2">
                    <div className="bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">Uploading... {uploadProgress}%</div>
                  </div>
                )}
                {uploadError && (
                  <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                    {uploadError}
                  </div>
                )}
                {form.files.length > 0 && (
                  <ul className="list-disc ml-6 text-blue-900 mt-2">
                    {form.files.map((f: File, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        {f.type.startsWith("image/") ? (
                          <img src={getFileUrl(f)} alt={f.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <span className="inline-block w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xl">📄</span>
                        )}
                        <span>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <Button
                          variant="icon"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => handleRemoveFile(f)}
                          type="button"
                          aria-label="Remove file"
                        >Remove</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-6 pt-6 border-t">
            <ButtonLoader
              loading={false}
              onClick={() => { 
                setShowModal(false); 
                setEditIdx(null); 
                setActiveSection('basics');
              }}
              label="Cancel"
              variant="secondary"
              type="button"
            />
            {activeSection === 'basics' && (
              <ButtonLoader
                loading={false}
                onClick={() => {
                  if (form.name && form.status_at_enrollment) {
                    setActiveSection('details');
                  } else {
                    showToast('Please complete all required fields in Project Basics', 'error');
                  }
                }}
                label="Next: Project Details"
                variant="primary"
                type="button"
                disabled={!form.name || !form.status_at_enrollment}
              />
            )}
            {activeSection === 'details' && (
              <ButtonLoader
                loading={submitting}
                onClick={handleSaveProject}
                label={editIdx !== null ? "Update Project" : "Create Project"}
                loadingText={editIdx !== null ? "Updating..." : "Creating..."}
                variant="primary"
                type="button"
                disabled={submitting || uploading || !form.name || !form.description || !form.status_at_enrollment || !form.challenge_description || !form.category}
              />
            )}
          </div>
        </Modal>
        {/* View Details Modal */}
        <Modal
          title={viewIdx !== null ? filteredProjects[viewIdx].name : "Project Details"}
          open={viewIdx !== null}
          onClose={() => setViewIdx(null)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {viewIdx !== null && (
            <div className="space-y-6">
              {/* Project Basics Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <RocketLaunchIcon className="w-5 h-5" />
                  Project Basics
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Project Name:</div>
                    <div className="text-blue-900 font-medium">{filteredProjects[viewIdx].name}</div>
                  </div>
                  {filteredProjects[viewIdx].team?.company_name && (
                    <div>
                      <div className="text-sm font-semibold text-blue-800 mb-1">Company Name:</div>
                      <div className="text-blue-900">{filteredProjects[viewIdx].team.company_name}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Team:</div>
                    <div className="text-blue-900">{teams.find(t => t.id === filteredProjects[viewIdx].team_id)?.teamName || filteredProjects[viewIdx].team?.team_name || "-"}</div>
                  </div>
                  {filteredProjects[viewIdx].status_at_enrollment && (
                    <div>
                      <div className="text-sm font-semibold text-blue-800 mb-1">Status at Enrollment:</div>
                      <div className="text-blue-900">{filteredProjects[viewIdx].status_at_enrollment}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Project Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-2">Description:</div>
                    <div className="text-blue-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">
                      {filteredProjects[viewIdx].description || "-"}
                    </div>
                  </div>
                  {filteredProjects[viewIdx].challenge_description && (
                    <div>
                      <div className="text-sm font-semibold text-blue-800 mb-2">Specific Challenge/Problem:</div>
                      <div className="text-blue-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">
                        {filteredProjects[viewIdx].challenge_description}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Category:</div>
                    <div className="text-blue-900">{filteredProjects[viewIdx].category}</div>
                  </div>
                </div>
              </div>

              {/* Project Status Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Project Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Status:</div>
                    <div className="text-blue-900">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {displayStatusMap[filteredProjects[viewIdx].status] || filteredProjects[viewIdx].status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Progress:</div>
                    <div className="text-blue-900">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${filteredProjects[viewIdx].progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{filteredProjects[viewIdx].progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Files Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Project Files</h3>
                {projectFiles[filteredProjects[viewIdx].id] ? (
                  projectFiles[filteredProjects[viewIdx].id].length > 0 ? (
                    <ul className="space-y-2">
                      {projectFiles[filteredProjects[viewIdx].id].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                          {f.type && f.type.startsWith("image/") ? (
                            <img
                              src={f.url}
                              alt={f.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.textContent = '🖼️';
                              }}
                            />
                          ) : null}
                          <span className="text-2xl">{getFileIcon(f.name, f.type)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-blue-900">{f.name}</div>
                            {f.size && <div className="text-xs text-blue-600">{(f.size / 1024 / 1024).toFixed(2)} MB</div>}
                          </div>
                          {f.url && (
                            <a
                              href={f.url}
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
                  )
                ) : (
                  <div className="text-blue-400">Loading files...</div>
                )}
              </div>

              {/* Comments Section */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Comments & Notes</h3>
                <div className="mb-2">
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    disabled={commenting}
                  />
                  <ButtonLoader
                    loading={commenting}
                    onClick={() => handleAddComment(filteredProjects[viewIdx].id)}
                    label="Post"
                    loadingText="Posting..."
                    variant="primary"
                    type="button"
                    className="mt-2"
                    disabled={!commentText.trim()}
                  />
                </div>
                {comments[filteredProjects[viewIdx].id] && comments[filteredProjects[viewIdx].id].length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {comments[filteredProjects[viewIdx].id].map((c, i) => (
                      <li key={i} className="border-b pb-1">
                        <span className="font-semibold text-blue-900">{c.name}</span> <span className="text-xs text-blue-500">{c.date}</span>
                        <div className="text-blue-800">{c.text}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-blue-400 italic">No comments yet.</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <ButtonLoader
                  loading={false}
                  onClick={() => setViewIdx(null)}
                  label="Close"
                  variant="secondary"
                  type="button"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Projects; 