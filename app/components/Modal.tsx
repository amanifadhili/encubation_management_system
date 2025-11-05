import React from "react";
import { ButtonLoader } from "./loading";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  role?: string;
  loading?: boolean;
  [key: string]: any;
}

const Modal: React.FC<ModalProps> = ({ title, open, onClose, children, actions, role = "dialog", loading = false, ...props }) => {
  if (!open) return null;
  
  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl transform transition-all duration-300 pointer-events-auto max-h-[90vh] flex flex-col"
          style={{
            boxShadow: '0 32px 56px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)'
          }}
          tabIndex={-1}
          role={role}
          aria-modal="true"
          {...props}
        >
          {/* Header with solid color background */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="Close Modal"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content with responsive padding */}
          <div className={`p-4 sm:p-6 overflow-y-auto flex-1 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            {children}
          </div>
          
          {/* Actions */}
          {actions && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-end gap-2 sm:gap-3">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal; 