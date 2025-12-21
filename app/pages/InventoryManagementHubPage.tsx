import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  WrenchIcon,
  CubeIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

const InventoryManagementHubPage = () => {
  const navigate = useNavigate();

  const managementCards = [
    {
      title: "Locations",
      description: "Manage storage locations",
      icon: MapPinIcon,
      path: "/inventory/locations",
      color: "blue",
    },
    {
      title: "Suppliers",
      description: "Manage suppliers and vendors",
      icon: TruckIcon,
      path: "/inventory/suppliers",
      color: "green",
    },
    {
      title: "Assignments",
      description: "Track item assignments to teams",
      icon: ClipboardDocumentCheckIcon,
      path: "/inventory/assignments",
      color: "purple",
    },
    {
      title: "Reservations",
      description: "Reserve items for future use",
      icon: CalendarDaysIcon,
      path: "/inventory/reservations",
      color: "orange",
    },
    {
      title: "Maintenance",
      description: "Schedule maintenance and logs",
      icon: WrenchIcon,
      path: "/inventory/maintenance",
      color: "red",
    },
    {
      title: "Consumables",
      description: "Track consumables distribution",
      icon: CubeIcon,
      path: "/inventory/consumables",
      color: "cyan",
    },
    {
      title: "Barcode Scanner",
      description: "Scan & generate barcodes",
      icon: QrCodeIcon,
      path: "/inventory/barcode-scanner",
      color: "indigo",
    },
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      hover: "group-hover:bg-blue-200",
      text: "text-blue-600",
    },
    green: {
      bg: "bg-green-100",
      hover: "group-hover:bg-green-200",
      text: "text-green-600",
    },
    purple: {
      bg: "bg-purple-100",
      hover: "group-hover:bg-purple-200",
      text: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-100",
      hover: "group-hover:bg-orange-200",
      text: "text-orange-600",
    },
    red: {
      bg: "bg-red-100",
      hover: "group-hover:bg-red-200",
      text: "text-red-600",
    },
    cyan: {
      bg: "bg-cyan-100",
      hover: "group-hover:bg-cyan-200",
      text: "text-cyan-600",
    },
    indigo: {
      bg: "bg-indigo-100",
      hover: "group-hover:bg-indigo-200",
      text: "text-indigo-600",
    },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-600">
              Manage locations, suppliers, assignments, reservations, maintenance, and more
            </p>
          </div>
        </div>

        {/* Management Navigation Cards */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {managementCards.map((card) => {
              const Icon = card.icon;
              const colors = colorClasses[card.color as keyof typeof colorClasses];
              return (
                <button
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all text-left group"
                >
                  <div
                    className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.hover}`}
                  >
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{card.title}</p>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Info Section */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About Inventory Management</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Access all inventory management tools from this hub. Manage storage locations,
              suppliers, track assignments and reservations, schedule maintenance, handle
              consumables, and use barcode scanning tools.
            </p>
            <p>
              Each tool provides comprehensive features to help you efficiently manage your
              inventory system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagementHubPage;

