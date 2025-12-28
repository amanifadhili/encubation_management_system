import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Badge from "../components/Badge";
import {
  getRequest,
  getRequestComments,
  addRequestComment,
  updateRequestComment,
  deleteRequestComment,
  getRequestHistory,
  submitRequest,
  cancelRequest,
  approveRequest,
  declineRequest,
  delegateApproval,
  updateDeliveryStatus,
} from "../services/api";

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  const [request, setRequest] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "items" | "approvals" | "comments" | "history">("details");

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showDeliveryStatusModal, setShowDeliveryStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isManagerOrDirector = user?.role === "manager" || user?.role === "director";
  const canApprove = isManagerOrDirector && request?.status === "pending_review";
  const canCancel = (request?.status === "draft" || request?.status === "pending_review") && 
                    (user?.userId === request?.requested_by || isManagerOrDirector);

  useEffect(() => {
    if (id) {
      loadRequest();
      loadComments();
      loadHistory();
    }
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await withRetry(() => getRequest(id), {
        maxRetries: 3,
        initialDelay: 1000,
      });
      setRequest(data?.data || data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading request");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      setLoadingComments(true);
      const data = await withRetry(() => getRequestComments(id), {
        maxRetries: 3,
      });
      setComments(Array.isArray(data) ? data : data?.comments || []);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      const data = await withRetry(() => getRequestHistory(id), {
        maxRetries: 3,
      });
      setHistory(Array.isArray(data) ? data : data?.history || []);
    } catch (error: any) {
      console.error("Error loading history:", error);
    }
  };

  // Helper functions for badges
  const getPriorityVariant = (priority: string): "default" | "info" | "warning" | "danger" => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "default";
      case "medium":
        return "info";
      case "high":
        return "warning";
      case "urgent":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "default";
      case "submitted":
        return "info";
      case "pending_review":
      case "pending":
        return "warning";
      case "approved":
      case "delivered":
      case "completed":
        return "success";
      case "partially_approved":
        return "info";
      case "declined":
        return "danger";
      case "cancelled":
        return "default";
      case "ordered":
      case "in_transit":
        return "info";
      case "returned":
        return "warning";
      default:
        return "default";
    }
  };

  const formatStatus = (status: string): string => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || status;
  };

  // Action handlers
  const handleSubmitRequest = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await withRetry(() => submitRequest(id), { maxRetries: 3 });
      showToast("Request submitted successfully!", "success");
      await loadRequest();
      await loadHistory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await withRetry(() => approveRequest(id, {
        comments: approvalComment || undefined,
        is_internal: isInternalComment,
      }), { maxRetries: 3 });
      showToast("Request approved!", "success");
      setShowApproveModal(false);
      setApprovalComment("");
      await loadRequest();
      await loadComments();
      await loadHistory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "approving request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!id || !declineReason.trim()) {
      showToast("Please provide a reason for declining.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await withRetry(() => declineRequest(id, {
        reason: declineReason,
        comments: approvalComment || undefined,
        is_internal: isInternalComment,
      }), { maxRetries: 3 });
      showToast("Request declined.", "info");
      setShowDeclineModal(false);
      setDeclineReason("");
      setApprovalComment("");
      await loadRequest();
      await loadComments();
      await loadHistory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "declining request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await withRetry(() => cancelRequest(id, {
        reason: cancelReason || undefined,
      }), { maxRetries: 3 });
      showToast("Request cancelled.", "info");
      setShowCancelModal(false);
      setCancelReason("");
      await loadRequest();
      await loadHistory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "cancelling request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) {
      showToast("Please enter a comment.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await withRetry(() => addRequestComment(id, {
        comment: commentText,
        is_internal: isInternalComment,
      }), { maxRetries: 3 });
      showToast("Comment added!", "success");
      setShowCommentModal(false);
      setCommentText("");
      setIsInternalComment(false);
      await loadComments();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "adding comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await withRetry(() => deleteRequestComment(id, commentId), { maxRetries: 3 });
      showToast("Comment deleted.", "success");
      await loadComments();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "deleting comment");
    }
  };

  const handleUpdateDeliveryStatus = async () => {
    if (!id || !deliveryStatus) {
      showToast("Please select a delivery status.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await withRetry(() => updateDeliveryStatus(id, {
        delivery_status: deliveryStatus,
      }), { maxRetries: 3 });
      showToast("Delivery status updated!", "success");
      setShowDeliveryStatusModal(false);
      setDeliveryStatus("");
      await loadRequest();
      await loadHistory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "updating delivery status");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !request) {
    return (
      <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <PageSkeleton count={4} layout="stacked" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate("/requests")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Requests
                </button>
              </div>
              <h1 className="text-3xl font-bold text-blue-900">
                {request.title || "Material Request"}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={getPriorityVariant(request.priority || "Medium")}>
                  {request.priority || "Medium"}
                </Badge>
                <Badge variant={getStatusVariant(request.status || "draft")}>
                  {formatStatus(request.status || "draft")}
                </Badge>
                {request.delivery_status && (
                  <Badge variant={getStatusVariant(request.delivery_status)}>
                    {formatStatus(request.delivery_status)}
                  </Badge>
                )}
              </div>
              <p className="text-blue-700 mt-2 font-mono text-sm">
                {request.request_number || `REQ-${id?.slice(0, 8)}`}
              </p>
            </div>
            <div className="flex gap-2">
              {request.status === "draft" && user?.userId === request.requested_by && (
                <ButtonLoader
                  loading={submitting}
                  onClick={handleSubmitRequest}
                  label="Submit Request"
                  variant="primary"
                />
              )}
              {canApprove && (
                <>
                  <ButtonLoader
                    loading={false}
                    onClick={() => setShowApproveModal(true)}
                    label="Approve"
                    variant="primary"
                  />
                  <ButtonLoader
                    loading={false}
                    onClick={() => setShowDeclineModal(true)}
                    label="Decline"
                    variant="secondary"
                  />
                </>
              )}
              {canCancel && (
                <ButtonLoader
                  loading={false}
                  onClick={() => setShowCancelModal(true)}
                  label="Cancel"
                  variant="secondary"
                />
              )}
              {isManagerOrDirector && (request.status === "approved" || request.status === "ordered" || request.status === "in_transit") && (
                <ButtonLoader
                  loading={false}
                  onClick={() => setShowDeliveryStatusModal(true)}
                  label="Update Delivery"
                  variant="secondary"
                />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {["details", "items", "approvals", "comments", "history"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "comments" && comments.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                      {comments.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Request Information</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900">{request.description || "N/A"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Team</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {request.team?.team_name || request.team?.name || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Requester</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {request.requester?.name || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Required By</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {request.required_by ? formatDate(request.required_by) : "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Dates</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Requested At</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formatDate(request.requested_at)}
                        </dd>
                      </div>
                      {request.submitted_at && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Submitted At</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(request.submitted_at)}
                          </dd>
                        </div>
                      )}
                      {request.approved_at && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(request.approved_at)}
                          </dd>
                        </div>
                      )}
                      {request.delivered_at && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Delivered At</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(request.delivered_at)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Delivery Information */}
                {(request.delivery_address || request.delivery_notes || request.expected_delivery) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Delivery Information</h3>
                    <dl className="space-y-3">
                      {request.delivery_address && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{request.delivery_address}</dd>
                        </div>
                      )}
                      {request.delivery_notes && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Delivery Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">{request.delivery_notes}</dd>
                        </div>
                      )}
                      {request.expected_delivery && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Expected Delivery</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(request.expected_delivery)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Notes */}
                {request.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items Tab */}
            {activeTab === "items" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Requested Items ({request.items?.length || 0})
                </h3>
                {request.items && request.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {request.items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.inventory_item?.name || item.item_name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.unit || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {item.is_consumable ? (
                                <Badge variant="info">Consumable</Badge>
                              ) : (
                                <Badge variant="default">Non-Consumable</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.notes || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No items in this request.</p>
                )}
              </div>
            )}

            {/* Approvals Tab */}
            {activeTab === "approvals" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Chain</h3>
                {request.approvals && request.approvals.length > 0 ? (
                  <div className="space-y-4">
                    {request.approvals.map((approval: any, index: number) => (
                      <div key={approval.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {approval.approver?.name || "Unknown Approver"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Level {approval.approval_level || index + 1}
                            </p>
                          </div>
                          <div>
                            {approval.status === "approved" && (
                              <Badge variant="success">Approved</Badge>
                            )}
                            {approval.status === "declined" && (
                              <Badge variant="danger">Declined</Badge>
                            )}
                            {approval.status === "pending" && (
                              <Badge variant="warning">Pending</Badge>
                            )}
                          </div>
                        </div>
                        {approval.comments && (
                          <p className="text-sm text-gray-600 mt-2">{approval.comments}</p>
                        )}
                        {approval.approved_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(approval.approved_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No approval chain information available.</p>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                  <ButtonLoader
                    loading={false}
                    onClick={() => setShowCommentModal(true)}
                    label="Add Comment"
                    variant="primary"
                  />
                </div>
                {loadingComments ? (
                  <PageSkeleton count={3} layout="stacked" />
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {comment.author?.name || comment.user?.name || "Unknown"}
                              </p>
                              {comment.is_internal && (
                                <Badge variant="default">Internal</Badge>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.comment || comment.text}</p>
                          </div>
                          {(user?.userId === comment.author_id || user?.userId === comment.user_id || isManagerOrDirector) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No comments yet.</p>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request History</h3>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((entry: any, index: number) => (
                      <div key={entry.id || index} className="border-l-4 border-gray-300 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{entry.action || entry.description || "Status change"}</p>
                            <p className="text-sm text-gray-500">
                              {entry.actor?.name || entry.user?.name || "System"}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(entry.created_at || entry.timestamp)}
                          </span>
                        </div>
                        {entry.comments && (
                          <p className="text-sm text-gray-600 mt-1">{entry.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No history available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment Modal */}
        <Modal
          title="Add Comment"
          open={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setCommentText("");
            setIsInternalComment(false);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                placeholder="Enter your comment..."
              />
            </div>
            {isManagerOrDirector && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Internal comment (only visible to managers/directors)</span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText("");
                  setIsInternalComment(false);
                }}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={submitting}
                onClick={handleAddComment}
                label="Add Comment"
                variant="primary"
              />
            </div>
          </div>
        </Modal>

        {/* Approve Modal */}
        <Modal
          title="Approve Request"
          open={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setApprovalComment("");
            setIsInternalComment(false);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
                placeholder="Add any comments..."
              />
            </div>
            {isManagerOrDirector && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Internal comment</span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalComment("");
                  setIsInternalComment(false);
                }}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={submitting}
                onClick={handleApprove}
                label="Approve"
                variant="primary"
              />
            </div>
          </div>
        </Modal>

        {/* Decline Modal */}
        <Modal
          title="Decline Request"
          open={showDeclineModal}
          onClose={() => {
            setShowDeclineModal(false);
            setDeclineReason("");
            setApprovalComment("");
            setIsInternalComment(false);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                required
                placeholder="Please provide a reason for declining..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={2}
                placeholder="Add any additional comments..."
              />
            </div>
            {isManagerOrDirector && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Internal comment</span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                  setApprovalComment("");
                  setIsInternalComment(false);
                }}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={submitting}
                onClick={handleDecline}
                label="Decline"
                variant="secondary"
              />
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          title="Cancel Request"
          open={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancelReason("");
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Why are you cancelling this request?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={submitting}
                onClick={handleCancel}
                label="Confirm Cancellation"
                variant="secondary"
              />
            </div>
          </div>
        </Modal>

        {/* Delivery Status Modal */}
        <Modal
          title="Update Delivery Status"
          open={showDeliveryStatusModal}
          onClose={() => {
            setShowDeliveryStatusModal(false);
            setDeliveryStatus("");
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Status <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                required
              >
                <option value="">Select status...</option>
                <option value="not_ordered">Not Ordered</option>
                <option value="ordered">Ordered</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => {
                  setShowDeliveryStatusModal(false);
                  setDeliveryStatus("");
                }}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={submitting}
                onClick={handleUpdateDeliveryStatus}
                label="Update Status"
                variant="primary"
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default RequestDetailPage;

