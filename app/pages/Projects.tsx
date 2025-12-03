import React, { useState, useEffect } from "react";
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

const categories = ["All", "Technology", "Agriculture", "Health", "Education"];
const statusOptions = ["All", "Active", "Pending", "Completed"];

function getFileUrl(file: File) {
  return URL.createObjectURL(file);
}

function getFileIcon(fileName: string, mimeType?: string) {
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
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: categories[1],
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
  // Status filter
  if (statusFilter !== "All") {
    filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
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
    if (idx !== null) {
      const p = filteredProjects[idx];
      setForm({
        name: p.name,
        description: p.description,
        category: p.category,
        status: p.status,
        progress: p.progress || 0,
        files: p.files || [],
      });
    } else {
      setForm({ name: "", description: "", category: categories[1], status: statusOptions[1], progress: 0, files: [] });
    }
    setShowModal(true);
  };

  // Save add/edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;

    setUploadError(null);
    setValidationErrors([]);
    setSubmitting(true);
    
    try {
      let result: any;
      if (editIdx !== null) {
        const projectId = filteredProjects[editIdx].id;
        result = await updateProject(projectId, {
          name: form.name,
          description: form.description,
          category: form.category,
          status: form.status,
          progress: form.progress
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

        setProjects(prev => prev.map(p => p.id === projectId ? result : p));
        showToast('Project updated successfully!', 'success');
      } else {
        result = await createProject({
          name: form.name,
          description: form.description,
          category: form.category,
          status: form.status,
          progress: form.progress,
          team_id: teamId
        });

        // Upload files if any
        if (form.files.length > 0) {
          setUploading(true);
          setUploadProgress(0);
          const formData = new FormData();
          form.files.forEach(file => formData.append('files', file));
          await uploadProjectFiles(result.id, formData, (progress) => {
            setUploadProgress(progress);
          });
          setUploading(false);
        }

        setProjects(prev => [...prev, result]);
        showToast('Project created successfully!', 'success');
      }
      setShowModal(false);
      setEditIdx(null);
      setForm({ name: "", description: "", category: categories[1], status: statusOptions[1], progress: 0, files: [] });
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
                            <td className="px-4 py-2 text-blue-900">{p.status}</td>
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
                                onClick={() => setViewIdx(idx)}
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
          onClose={() => { setShowModal(false); setEditIdx(null); setValidationErrors([]); setTouchedFields(new Set()); }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSave}>
            <ValidationErrors 
              errors={validationErrors} 
              onFieldFocus={handleFieldFocus}
            />
            
            <FormField
              label="Project Name"
              name="name"
              error={getFieldError('name')}
              touched={touchedFields.has('name')}
              required
              autoFocus={focusedField === 'name'}
            >
              <input
                id="name"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onBlur={() => handleFieldBlur('name')}
                disabled={submitting || uploading}
                required
              />
            </FormField>
            
            <FormField
              label="Description"
              name="description"
              error={getFieldError('description')}
              touched={touchedFields.has('description')}
              required
              autoFocus={focusedField === 'description'}
            >
              <textarea
                id="description"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                onBlur={() => handleFieldBlur('description')}
                rows={4}
                disabled={submitting || uploading}
                required
              />
            </FormField>
            
            <FormField
              label="Category"
              name="category"
              error={getFieldError('category')}
              touched={touchedFields.has('category')}
              autoFocus={focusedField === 'category'}
            >
              <select
                id="category"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                onBlur={() => handleFieldBlur('category')}
                disabled={submitting || uploading}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </FormField>
            
            <FormField
              label="Status"
              name="status"
              error={getFieldError('status')}
              touched={touchedFields.has('status')}
              autoFocus={focusedField === 'status'}
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
              autoFocus={focusedField === 'progress'}
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
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                loading={false}
                onClick={() => { setShowModal(false); setEditIdx(null); }}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                label={editIdx !== null ? "Update Project" : "Create Project"}
                loadingText={editIdx !== null ? "Updating..." : "Creating..."}
                variant="primary"
                type="submit"
                disabled={submitting || uploading}
              />
            </div>
          </form>
        </Modal>
        {/* View Details Modal */}
        <Modal
          title={viewIdx !== null ? `Project Details: ${filteredProjects[viewIdx].name}` : "Project Details"}
          open={viewIdx !== null}
          onClose={() => setViewIdx(null)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {viewIdx !== null && (
            <>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Team:</div>
                <div className="text-blue-900">{teams.find(t => t.id === filteredProjects[viewIdx].team_id)?.teamName || "-"}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Description:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].description}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Category:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].category}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Status:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].status}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Progress:</div>
                <div className="text-blue-900">{filteredProjects[viewIdx].progress || 0}%</div>
              </div>
              {/* Files */}
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Files:</div>
                {projectFiles[filteredProjects[viewIdx].id] ? (
                  projectFiles[filteredProjects[viewIdx].id].length > 0 ? (
                    <ul className="space-y-2">
                      {projectFiles[filteredProjects[viewIdx].id].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
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
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              View
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-blue-400">No files uploaded.</div>
                  )
                ) : (
                  <div className="text-blue-400">Loading files...</div>
                )}
              </div>
              {/* Comments */}
              <div className="mb-4">
                <div className="font-semibold text-blue-800 mb-1">Comments:</div>
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
                  <div className="text-blue-400">No comments yet.</div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <ButtonLoader
                  loading={false}
                  onClick={() => setViewIdx(null)}
                  label="Close"
                  variant="secondary"
                  type="button"
                />
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Projects; 