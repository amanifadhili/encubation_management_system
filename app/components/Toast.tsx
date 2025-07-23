import React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const typeStyles = {
  success: "bg-green-100 text-green-800 border-green-400",
  error: "bg-red-100 text-red-800 border-red-400",
  info: "bg-blue-100 text-blue-800 border-blue-400",
};

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => (
  <div className={`fixed top-6 right-6 z-50 px-6 py-4 border rounded shadow-lg flex items-center space-x-4 ${typeStyles[type]}`}> 
    <span>{message}</span>
    <button onClick={onClose} className="ml-4 text-lg font-bold">&times;</button>
  </div>
);

export default Toast; 