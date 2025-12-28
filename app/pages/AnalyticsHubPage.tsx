import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const AnalyticsHubPage = () => {
  const navigate = useNavigate();

  const analyticsCards = [
    {
      title: "Inventory Analytics",
      description: "Usage, trends, low stock",
      icon: CubeIcon,
      path: "/reports/inventory",
      color: "blue",
    },
    {
      title: "Request Analytics",
      description: "Approval rates, trends",
      icon: ClipboardDocumentListIcon,
      path: "/reports/requests",
      color: "green",
    },
    {
      title: "Consumption Reports",
      description: "Usage patterns, distribution",
      icon: ChartBarIcon,
      path: "/reports/consumption",
      color: "purple",
    },
    {
      title: "Replenishment Forecast",
      description: "Forecasting, auto-reorder",
      icon: ArrowPathIcon,
      path: "/reports/replenishment",
      color: "orange",
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
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Hub</h1>
            <p className="text-sm text-gray-600">
              Comprehensive analytics and insights for inventory, requests, and consumption
            </p>
          </div>
        </div>

        {/* Analytics Navigation Cards */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsCards.map((card) => {
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About Analytics</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Access detailed analytics and reports to gain insights into your inventory usage,
              request patterns, consumption trends, and replenishment forecasting.
            </p>
            <p>
              Each analytics page provides comprehensive data visualization, filtering options, and
              export capabilities to help you make informed decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHubPage;

