import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Badge from "../components/Badge";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import {
  getAllRequestTemplates,
  getRequestTemplateById,
  createRequestTemplate,
  updateRequestTemplate,
  deleteRequestTemplate,
  createRequestFromTemplate,
  getInventory,
} from "../services/api";

const RequestTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>("all"); // all, my, public
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    is_public: false,
    items: [{
      inventory_item_id: "",
      item_name: "",
      quantity: 1,
      unit: "",
      is_consumable: false,
      isManualEntry: false,
    }] as Array<{
      inventory_item_id: string;
      item_name: string;
      quantity: number;
      unit: string;
      is_consumable: boolean;
      isManualEntry: boolean;
    }>,
  });

  const isManagerOrDirector = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    loadTemplates();
    loadInventory();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await withRetry(() => getAllRequestTemplates(), {
        maxRetries: 3,
        initialDelay: 1000,
      });
      const templatesData = Array.isArray(data) ? data : data?.templates || data?.data?.templates || [];
      setTemplates(templatesData);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading templates");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await withRetry(() => getInventory(), {
        maxRetries: 3,
      });
      const inventoryData = data?.items || data?.data?.items || data || [];
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by type
    if (filterType === "my") {
      filtered = filtered.filter((t) => t.created_by === user?.userId || !t.is_public);
    } else if (filterType === "public") {
      filtered = filtered.filter((t) => t.is_public === true);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, filterType, searchQuery, user?.userId]);

  const handleOpenModal = (template?: any) => {
    if (template) {
      setSelectedTemplate(template);
      setIsEdit(true);
      setForm({
        name: template.name || "",
        description: template.description || "",
        category: template.category || "",
        is_public: template.is_public || false,
        items: template.items?.map((item: any) => ({
          inventory_item_id: item.inventory_item_id || "",
          item_name: item.item_name || "",
          quantity: item.quantity || 1,
          unit: item.unit || "",
          is_consumable: item.is_consumable || false,
          isManualEntry: !item.inventory_item_id,
        })) || [{
          inventory_item_id: "",
          item_name: "",
          quantity: 1,
          unit: "",
          is_consumable: false,
          isManualEntry: false,
        }],
      });
    } else {
      setSelectedTemplate(null);
      setIsEdit(false);
      setForm({
        name: "",
        description: "",
        category: "",
        is_public: false,
        items: [{
          inventory_item_id: "",
          item_name: "",
          quantity: 1,
          unit: "",
          is_consumable: false,
          isManualEntry: false,
        }],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setIsEdit(false);
    setForm({
      name: "",
      description: "",
      category: "",
      is_public: false,
      items: [{
        inventory_item_id: "",
        item_name: "",
        quantity: 1,
        unit: "",
        is_consumable: false,
        isManualEntry: false,
      }],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("Please enter a template name.", "error");
      return;
    }

    if (form.items.length === 0 || form.items.some(item => item.quantity <= 0)) {
      showToast("Please add at least one item with quantity.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const itemsData = form.items.map(item => {
        const itemData: any = {
          quantity: item.quantity,
        };
        if (item.isManualEntry) {
          itemData.item_name = item.item_name;
          if (item.unit) itemData.unit = item.unit;
        } else {
          if (item.inventory_item_id) {
            itemData.inventory_item_id = item.inventory_item_id;
          } else {
            itemData.item_name = item.item_name || "Unknown Item";
          }
        }
        if (item.is_consumable) itemData.is_consumable = true;
        return itemData;
      });

      const templateData: any = {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        is_public: form.is_public && isManagerOrDirector,
        items: itemsData,
      };

      if (isEdit && selectedTemplate) {
        await withRetry(() => updateRequestTemplate(selectedTemplate.id, templateData), {
          maxRetries: 3,
        });
        showToast("Template updated successfully!", "success");
      } else {
        await withRetry(() => createRequestTemplate(templateData), {
          maxRetries: 3,
        });
        showToast("Template created successfully!", "success");
      }

      handleCloseModal();
      await loadTemplates();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? "updating template" : "creating template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      await withRetry(() => deleteRequestTemplate(selectedTemplate.id), {
        maxRetries: 3,
      });
      showToast("Template deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "deleting template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequestFromTemplate = async (template: any) => {
    try {
      const teamId = user?.role === "incubator" ? (user as any).teamId : undefined;
      const requestData = await withRetry(() => createRequestFromTemplate(template.id, {
        team_id: teamId,
      }), {
        maxRetries: 3,
      });

      const request = requestData?.data || requestData;
      if (request?.id) {
        navigate(`/requests/${request.id}`);
        showToast("Request created from template!", "success");
      } else {
        // Navigate to create request page with template data
        navigate("/requests/create", { state: { template } });
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "creating request from template");
    }
  };

  const canEdit = (template: any) => {
    return isManagerOrDirector || template.created_by === user?.userId;
  };

  const canDelete = (template: any) => {
    return isManagerOrDirector || template.created_by === user?.userId;
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Request Templates
              </h1>
              <p className="text-white opacity-90">
                Create and manage reusable request templates for faster material requests.
              </p>
            </div>
            <ButtonLoader
              loading={false}
              onClick={() => handleOpenModal()}
              label="+ Create Template"
              variant="primary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full md:w-auto px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Templates</option>
                <option value="my">My Templates</option>
                <option value="public">Public Templates</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <PageSkeleton count={6} layout="grid" />
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery || filterType !== "all"
                ? "No templates found matching your criteria."
                : "No templates yet. Create your first template!"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {template.name}
                    </h3>
                    {template.is_public && (
                      <Badge variant="info">Public</Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.category && (
                    <p className="text-xs text-gray-500 mb-3">
                      Category: {template.category}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    {template.items?.length || 0} item(s)
                  </p>
                  <div className="flex gap-2">
                    <ButtonLoader
                      loading={false}
                      onClick={() => handleCreateRequestFromTemplate(template)}
                      label="Create Request"
                      variant="primary"
                      className="flex-1 text-sm"
                    />
                    {canEdit(template) && (
                      <button
                        onClick={() => handleOpenModal(template)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete(template) && (
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Template Modal */}
        <Modal
          title={isEdit ? "Edit Template" : "Create Template"}
          open={showModal}
          onClose={handleCloseModal}
        >
          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-blue-800">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-blue-800">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-blue-800">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={submitting}
                  placeholder="e.g., Office Supplies, Equipment"
                />
              </div>

              {isManagerOrDirector && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                    className="mr-2"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-blue-800">Make this template public</span>
                </label>
              )}

              {/* Items Section */}
              <div className="border-t pt-4">
                <label className="block mb-2 font-semibold text-blue-800">
                  Items <span className="text-red-500">*</span>
                </label>
                {form.items.map((item, index) => (
                  <div key={index} className="mb-4 p-3 bg-gray-50 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-blue-800">Item {index + 1}</span>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              items: f.items.filter((_, i) => i !== index),
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={item.isManualEntry}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].isManualEntry = e.target.checked;
                          if (!e.target.checked) {
                            newItems[index].item_name = "";
                          }
                          setForm((f) => ({ ...f, items: newItems }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-blue-700">Manual Entry</span>
                    </label>

                    {item.isManualEntry ? (
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                          value={item.item_name}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].item_name = e.target.value;
                            setForm((f) => ({ ...f, items: newItems }));
                          }}
                          required
                          disabled={submitting}
                        />
                      </div>
                    ) : (
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-blue-700 mb-1">Material</label>
                        <select
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                          value={item.inventory_item_id}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].inventory_item_id = e.target.value;
                            const material = inventory.find(m => String(m.id) === e.target.value);
                            if (material) {
                              newItems[index].item_name = material.name;
                            }
                            setForm((f) => ({ ...f, items: newItems }));
                          }}
                          required
                          disabled={submitting || loadingInventory}
                        >
                          <option value="">Select material...</option>
                          {inventory.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].quantity = Number(e.target.value) || 1;
                            setForm((f) => ({ ...f, items: newItems }));
                          }}
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Unit</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                          value={item.unit}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].unit = e.target.value;
                            setForm((f) => ({ ...f, items: newItems }));
                          }}
                          disabled={submitting}
                          placeholder="e.g., pcs"
                        />
                      </div>
                    </div>

                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={item.is_consumable}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].is_consumable = e.target.checked;
                          setForm((f) => ({ ...f, items: newItems }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-blue-700">Is Consumable</span>
                    </label>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      items: [...f.items, {
                        inventory_item_id: "",
                        item_name: "",
                        quantity: 1,
                        unit: "",
                        is_consumable: false,
                        isManualEntry: false,
                      }],
                    }));
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  + Add Another Item
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <ButtonLoader
                  loading={false}
                  onClick={handleCloseModal}
                  label="Cancel"
                  variant="secondary"
                  type="button"
                />
                <ButtonLoader
                  loading={submitting}
                  label={isEdit ? "Update Template" : "Create Template"}
                  variant="primary"
                  type="submit"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTemplate(null);
          }}
          onConfirm={handleDelete}
          title="Delete Template"
          message={`Are you sure you want to delete the template "${selectedTemplate?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isLoading={submitting}
        />
      </div>
    </div>
  );
};

export default RequestTemplatesPage;

