import React from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeStyles = {
  success: "bg-green-100 text-green-800 border-green-400",
  error: "bg-red-100 text-red-800 border-red-400",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-400",
  info: "bg-blue-100 text-blue-800 border-blue-400",
};

const typeIcons = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose, action }) => (
  <div 
    className={`px-6 py-4 border rounded-lg shadow-lg flex items-center justify-between space-x-4 ${typeStyles[type]} animate-slide-in-right min-w-[300px] max-w-[500px]`}
  > 
    <div className="flex items-center space-x-3 flex-1">
      <span className="text-xl font-bold">{typeIcons[type]}</span>
      <span className="flex-1">{message}</span>
    </div>
    <div className="flex items-center space-x-2">
      {action && (
        <button 
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className="px-3 py-1 text-sm font-semibold rounded hover:opacity-80 underline"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="text-lg font-bold hover:opacity-70">&times;</button>
    </div>
  </div>
);

export default Toast;