import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  createRequest,
  getInventory,
  getAllRequestTemplates,
  getRequestTemplateById,
  createRequestFromTemplate,
} from "../services/api";

const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const teamId = user?.role === "incubator" ? (user as any).teamId : undefined;
  const isManagerOrDirector = user?.role === "manager" || user?.role === "director";

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    urgency_reason: "",
    required_by: "",
    is_consumable_request: false,
    requires_quick_approval: false,
    delivery_address: "",
    delivery_notes: "",
    expected_delivery: "",
    notes: "",
    items: [{
      inventory_item_id: "",
      item_name: "",
      quantity: 1,
      unit: "",
      is_consumable: false,
      notes: "",
      isManualEntry: false,
    }] as Array<{
      inventory_item_id: string;
      item_name: string;
      quantity: number;
      unit: string;
      is_consumable: boolean;
      notes: string;
      isManualEntry: boolean;
    }>,
  });

  useEffect(() => {
    loadInventory();
    loadTemplates();
    
    // Check if template is passed via location state
    if (location.state?.template) {
      loadTemplateData(location.state.template);
    }
  }, [location.state]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await withRetry(() => getInventory(), {
        maxRetries: 3,
      });
      const inventoryData = data?.items || data?.data?.items || data || [];
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await withRetry(() => getAllRequestTemplates(), {
        maxRetries: 3,
      });
      const templatesData = Array.isArray(data) ? data : data?.templates || data?.data?.templates || [];
      setTemplates(templatesData);
    } catch (error: any) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplateData = async (template: any) => {
    try {
      // If template object is already loaded, use it directly
      if (template.items) {
        setForm({
          title: template.name || "",
          description: template.description || "",
          priority: "Medium",
          urgency_reason: "",
          required_by: "",
          is_consumable_request: false,
          requires_quick_approval: false,
          delivery_address: "",
          delivery_notes: "",
          expected_delivery: "",
          notes: "",
          items: template.items.map((item: any) => ({
            inventory_item_id: item.inventory_item_id || "",
            item_name: item.item_name || "",
            quantity: item.quantity || 1,
            unit: item.unit || "",
            is_consumable: item.is_consumable || false,
            notes: item.notes || "",
            isManualEntry: !item.inventory_item_id,
          })),
        });
        setSelectedTemplate(template);
      } else {
        // Otherwise, fetch the template
        const templateData = await withRetry(() => getRequestTemplateById(template.id || template), {
          maxRetries: 3,
        });
        const fullTemplate = templateData?.data || templateData;
        if (fullTemplate?.items) {
          setForm({
            title: fullTemplate.name || "",
            description: fullTemplate.description || "",
            priority: "Medium",
            urgency_reason: "",
            required_by: "",
            is_consumable_request: false,
            requires_quick_approval: false,
            delivery_address: "",
            delivery_notes: "",
            expected_delivery: "",
            notes: "",
            items: fullTemplate.items.map((item: any) => ({
              inventory_item_id: item.inventory_item_id || "",
              item_name: item.item_name || "",
              quantity: item.quantity || 1,
              unit: item.unit || "",
              is_consumable: item.is_consumable || false,
              notes: item.notes || "",
              isManualEntry: !item.inventory_item_id,
            })),
          });
          setSelectedTemplate(fullTemplate);
        }
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading template");
    }
  };

  const handleTemplateSelect = (template: any) => {
    loadTemplateData(template);
    setShowTemplateSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();

    // Validate required fields
    if (!form.title.trim()) {
      showToast("Please enter a request title.", "error");
      return;
    }

    if (form.items.length === 0 || !form.items[0].quantity) {
      showToast("Please add at least one item with quantity.", "error");
      return;
    }

    // Validate urgency reason if priority is High or Urgent
    if ((form.priority === "High" || form.priority === "Urgent") && !form.urgency_reason.trim()) {
      showToast("Please provide a reason for high/urgent priority.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare items array
      const items = form.items
        .filter(item => item.quantity > 0)
        .map(item => {
          const itemData: any = {
            quantity: item.quantity,
          };

          if (item.isManualEntry) {
            // Manual entry
            itemData.item_name = item.item_name;
            if (item.unit) itemData.unit = item.unit;
          } else {
            // Inventory item
            if (item.inventory_item_id) {
              itemData.inventory_item_id = item.inventory_item_id;
            } else {
              // Fallback: find material by name
              const material = inventory.find(m => String(m.id) === item.inventory_item_id);
              if (material) {
                itemData.inventory_item_id = material.id;
              } else {
                itemData.item_name = item.item_name || "Unknown Item";
              }
            }
          }

          if (item.is_consumable) itemData.is_consumable = true;
          if (item.notes) itemData.notes = item.notes;

          return itemData;
        });

      const requestData: any = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        urgency_reason: (form.priority === "High" || form.priority === "Urgent")
          ? form.urgency_reason
          : undefined,
        required_by: form.required_by || undefined,
        is_consumable_request: form.is_consumable_request,
        requires_quick_approval: form.requires_quick_approval,
        delivery_address: form.delivery_address || undefined,
        delivery_notes: form.delivery_notes || undefined,
        expected_delivery: form.expected_delivery || undefined,
        notes: form.notes || undefined,
        items: items,
        status: saveAsDraft ? "draft" : "submitted",
      };

      // Add team_id for incubators
      if (user?.role === "incubator" && teamId) {
        requestData.team_id = teamId;
      }

      // If creating from template, use the template API
      if (selectedTemplate) {
        const result = await withRetry(() => createRequestFromTemplate(selectedTemplate.id, requestData), {
          maxRetries: 3,
        });
        const request = result?.data || result;
        if (request?.id) {
          showToast(saveAsDraft ? "Request saved as draft!" : "Request created and submitted!", "success");
          navigate(`/requests/${request.id}`);
        } else {
          showToast("Request created successfully!", "success");
          navigate("/requests");
        }
      } else {
        const result = await withRetry(() => createRequest(requestData), {
          maxRetries: 3,
        });
        const request = result?.data || result;
        if (request?.id) {
          showToast(saveAsDraft ? "Request saved as draft!" : "Request created and submitted!", "success");
          navigate(`/requests/${request.id}`);
        } else {
          showToast("Request created successfully!", "success");
          navigate("/requests");
        }
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "creating request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <PageSkeleton count={4} layout="stacked" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate("/requests")}
                className="text-white hover:text-blue-100 mb-2 text-sm"
              >
                ← Back to Requests
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Create Material Request
              </h1>
              {selectedTemplate && (
                <p className="text-white opacity-90 mt-1 text-sm">
                  Using template: {selectedTemplate.name}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 text-sm font-medium"
            >
              Start from Template
            </button>
          </div>
        </div>

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-blue-900">Select a Template</h2>
                  <button
                    onClick={() => setShowTemplateSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                {loadingTemplates ? (
                  <PageSkeleton count={3} layout="stacked" />
                ) : templates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No templates available.</p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border rounded hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-blue-900">{template.name}</h3>
                            {template.description && (
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {template.items?.length || 0} item(s)
                            </p>
                          </div>
                          {template.is_public && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded shadow p-6">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">
                    Request Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    disabled={submitting}
                    placeholder="e.g., Request for Laptops"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    disabled={submitting}
                    rows={3}
                    placeholder="Optional description of the request"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">Priority</label>
                    <select
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priority: e.target.value,
                          urgency_reason: (e.target.value === "High" || e.target.value === "Urgent") ? f.urgency_reason : "",
                        }))
                      }
                      disabled={submitting}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">Required By</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.required_by}
                      onChange={(e) => setForm((f) => ({ ...f, required_by: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Urgency Reason (if High/Urgent) */}
                {(form.priority === "High" || form.priority === "Urgent") && (
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">
                      Urgency Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.urgency_reason}
                      onChange={(e) => setForm((f) => ({ ...f, urgency_reason: e.target.value }))}
                      disabled={submitting}
                      required
                      rows={2}
                      placeholder="Please explain why this request is urgent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Requested Items</h2>
              {form.items.map((item, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-3">
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

                  {/* Toggle between inventory item and manual entry */}
                  <div className="mb-3">
                    <label className="flex items-center">
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
                  </div>

                  {item.isManualEntry ? (
                    <>
                      <div className="mb-3">
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
                          disabled={submitting}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mb-3">
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
                        disabled={submitting}
                        required
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

                  <div className="grid grid-cols-2 gap-3">
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
                        disabled={submitting}
                        required
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
                        placeholder="e.g., pcs, boxes"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center">
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
                      notes: "",
                      isManualEntry: false,
                    }],
                  }));
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                + Add Another Item
              </button>
            </div>

            {/* Request Options */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Request Options</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_consumable_request}
                    onChange={(e) => setForm((f) => ({ ...f, is_consumable_request: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-blue-800">Is Consumable Request</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.requires_quick_approval}
                    onChange={(e) => setForm((f) => ({ ...f, requires_quick_approval: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-blue-800">Requires Quick Approval</span>
                </label>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Delivery Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Delivery Address</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.delivery_address}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_address: e.target.value }))}
                    disabled={submitting}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Delivery Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.delivery_notes}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_notes: e.target.value }))}
                    disabled={submitting}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Expected Delivery Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.expected_delivery}
                    onChange={(e) => setForm((f) => ({ ...f, expected_delivery: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Additional Notes</h2>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                disabled={submitting}
                rows={3}
                placeholder="Any additional information about this request..."
              />
            </div>

            {/* Actions */}
            <div className="border-t pt-6 flex justify-end gap-3">
              <ButtonLoader
                loading={false}
                onClick={() => navigate("/requests")}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                onClick={(e: any) => handleSubmit(e, true)}
                label="Save as Draft"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                label="Submit Request"
                variant="primary"
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;

