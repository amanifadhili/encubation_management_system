import React, { useState } from "react";
import { requests as mockRequests, incubators, mentors, tools } from "../mock/sampleData";
import { useAuth } from "../context/AuthContext";
import Table, { type TableColumn } from "../components/Table";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import RoleGuard from "../components/RoleGuard";
import Tooltip from "../components/Tooltip";
import { useToast } from "../components/Layout";

const REQUEST_TYPES = [
  { value: "tool", label: "Tool" },
  { value: "facility", label: "Facility" },
  { value: "resource", label: "Resource" },
  { value: "mentorship", label: "Mentorship" },
  { value: "other", label: "Other" },
];

const defaultForm = {
  type: "tool",
  item: "",
  mentor: "",
  description: "",
  status: "Pending",
  incubatorId: 0,
  requestedBy: "",
  date: "",
};

const PAGE_SIZE = 5;

const statusIcons = {
  Pending: (
    <span className="inline-block align-middle text-yellow-500 mr-1" title="Pending">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
    </span>
  ),
  Approved: (
    <span className="inline-block align-middle text-green-600 mr-1" title="Approved">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
    </span>
  ),
  Declined: (
    <span className="inline-block align-middle text-red-600 mr-1" title="Declined">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
    </span>
  ),
};

const RequestHandling = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [requests, setRequests] = useState([...mockRequests]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState<{ open: boolean; id: number | null; action: "Approve" | "Decline" | null }>({ open: false, id: null, action: null });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; request: any | null }>({ open: false, request: null });

  // Filter requests by role
  let filtered = requests;
  if (user?.role === "incubator") {
    const incubator = incubators.find(i => i.members.includes(user.name.split(" ")[0]));
    filtered = requests.filter(r => r.incubatorId === incubator?.id);
  }
  if (search) {
    filtered = filtered.filter(r =>
      (r.type && r.type.toLowerCase().includes(search.toLowerCase())) ||
      (r.item && r.item.toLowerCase().includes(search.toLowerCase())) ||
      (r.mentor && r.mentor.toLowerCase().includes(search.toLowerCase())) ||
      (r.status && r.status.toLowerCase().includes(search.toLowerCase())) ||
      (r.requestedBy && r.requestedBy.toLowerCase().includes(search.toLowerCase()))
    );
  }
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Table columns
  const columns: TableColumn<typeof requests[0]>[] = [
    { key: "type", label: "Type", className: "font-semibold text-blue-800" },
    { key: "item", label: "Item/Facility/Mentor", render: row => row.type === "mentorship" ? row.mentor : row.item, className: "text-blue-700" },
    { key: "status", label: "Status", render: row => <span>{statusIcons[row.status]}<StatusBadge status={row.status} /></span>, className: "text-blue-700" },
    { key: "requestedBy", label: "Requested By", className: "text-blue-700" },
    { key: "date", label: "Date", className: "text-blue-700" },
  ];

  // Modal form handlers
  const openAddModal = () => {
    setForm({ ...defaultForm, type: "tool", item: tools[0]?.name || "", mentor: "", incubatorId: getIncubatorId(), requestedBy: user?.name || "", date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  function getIncubatorId() {
    if (user?.role !== "incubator") return 0;
    const incubator = incubators.find(i => i.members.includes(user.name.split(" ")[0]));
    return incubator?.id || 0;
  }
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const incubatorId = getIncubatorId();
    if (user?.role === "incubator" && !incubatorId) {
      showToast("Your user is not linked to any incubator team. Please contact admin.", "error");
      setIsSubmitting(false);
      return;
    }
    if (!form.type || (form.type === "tool" && !form.item) || (form.type === "facility" && !form.item) || (form.type === "resource" && !form.item) || (form.type === "mentorship" && !form.mentor) || (form.type === "other" && !form.description)) {
      showToast("Please fill all required fields.", "error");
      setIsSubmitting(false);
      return;
    }
    setRequests(prev => [
      ...prev,
      {
        ...form,
        incubatorId, // always set correct incubatorId
        id: Math.max(0, ...prev.map(r => r.id)) + 1,
        status: "Pending",
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setShowModal(false);
    setIsSubmitting(false);
    setPage(1); // show the new request on first page
    showToast("Request submitted!", "success");
  };

  // Manager actions
  const handleAction = (id: number, action: "Approve" | "Decline") => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    setActionModal({ open: false, id: null, action: null });
    showToast(`Request ${action.toLowerCase()}d!`, action === "Approve" ? "success" : "error");
  };

  // Empty state message
  const emptyMessage = user?.role === "incubator"
    ? "No requests yet. Submit your first request!"
    : "No requests found.";

  // Details modal content
  const renderDetails = (req: any) => (
    <div className="space-y-2">
      <div><span className="font-semibold text-blue-800">Type:</span> {req.type}</div>
      {req.type === "mentorship" && <div><span className="font-semibold text-blue-800">Mentor:</span> {req.mentor}</div>}
      {["tool", "facility", "resource"].includes(req.type) && <div><span className="font-semibold text-blue-800">Item/Facility/Resource:</span> {req.item}</div>}
      {req.type === "other" && <div><span className="font-semibold text-blue-800">Description:</span> {req.description}</div>}
      <div><span className="font-semibold text-blue-800">Status:</span> <span>{statusIcons[req.status]}<StatusBadge status={req.status} /></span></div>
      <div><span className="font-semibold text-blue-800">Requested By:</span> {req.requestedBy}</div>
      <div><span className="font-semibold text-blue-800">Date:</span> {req.date}</div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900">Request Handling</h1>
        <p className="text-blue-700 mt-2 max-w-2xl">Submit and track requests for tools, facilities, resources, or mentorship. Managers can approve or decline requests. Click a row to view details.</p>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search by type, item, mentor, or status..."
          />
          <RoleGuard allowed={["incubator"]}>
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
              onClick={openAddModal}
            >
              + Submit Request
            </button>
          </RoleGuard>
        </div>
      </div>
      <div className="min-w-[600px]">
        <Table
          columns={columns}
          data={paginated}
          actions={user?.role === "manager" ? (row) => (
            row.status === "Pending" ? (
              <div className="flex gap-2">
                <Tooltip label="Approve">
                  <button
                    className="p-2 rounded-full hover:bg-green-100 text-green-700"
                    onClick={() => setActionModal({ open: true, id: row.id, action: "Approve" })}
                    aria-label="Approve"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip label="Decline">
                  <button
                    className="p-2 rounded-full hover:bg-red-100 text-red-700"
                    onClick={() => setActionModal({ open: true, id: row.id, action: "Decline" })}
                    aria-label="Decline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            ) : null
          ) : undefined}
          emptyMessage={emptyMessage}
          className="cursor-pointer"
          // Row click for details modal
          // @ts-ignore
          onRowClick={row => setDetailsModal({ open: true, request: row })}
        />
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {/* Add Request Modal (Incubator) */}
      <Modal
        title="Submit Request"
        open={showModal}
        onClose={() => setShowModal(false)}
      >
        <form id="request-form" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Request Type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              required
            >
              {REQUEST_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          {["tool", "facility", "resource"].includes(form.type) && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">{form.type.charAt(0).toUpperCase() + form.type.slice(1)} *</label>
              <input
                name="item"
                value={form.item}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                placeholder={`Enter ${form.type} name`}
                required
              />
            </div>
          )}
          {form.type === "mentorship" && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Mentor *</label>
              <select
                name="mentor"
                value={form.mentor}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
              >
                <option value="">Select Mentor</option>
                {mentors.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          {form.type === "other" && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                placeholder="Describe your request"
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-blue-700 rounded font-semibold hover:bg-gray-300"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
              disabled={isSubmitting}
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>
      {/* Approve/Decline Modal (Manager) */}
      <Modal
        title={actionModal.action ? `${actionModal.action} Request` : ""}
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, id: null, action: null })}
        actions={
          <>
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-blue-700 rounded font-semibold hover:bg-gray-300"
              onClick={() => setActionModal({ open: false, id: null, action: null })}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-4 py-2 ${actionModal.action === "Approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white rounded font-semibold shadow`}
              onClick={() => actionModal.id && actionModal.action && handleAction(actionModal.id, actionModal.action)}
            >
              {actionModal.action}
            </button>
          </>
        }
      >
        <div className="py-2 text-blue-900">
          Are you sure you want to {actionModal.action?.toLowerCase()} this request?
        </div>
      </Modal>
      {/* Request Details Modal */}
      <Modal
        title="Request Details"
        open={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, request: null })}
      >
        {detailsModal.request && renderDetails(detailsModal.request)}
      </Modal>
    </div>
  );
};

export default RequestHandling; 