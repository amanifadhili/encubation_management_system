import React from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  role?: string;
  [key: string]: any;
}

const Modal: React.FC<ModalProps> = ({ title, open, onClose, children, actions, role = "dialog", ...props }) => {
  if (!open) return null;
  return (
    <>
      {/* Modal disables background interaction via pointer-events-none on body */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        {/* This empty div disables pointer events on the background */}
      </div>
      <div
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl border border-blue-100 w-full max-w-md md:max-w-lg mx-2 overflow-y-auto max-h-[90vh] pointer-events-auto"
        tabIndex={-1}
        role={role}
        aria-modal="true"
        {...props}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
          <button onClick={onClose} className="text-2xl text-blue-700 font-bold hover:text-blue-900" aria-label="Close Modal">&times;</button>
        </div>
        <div>{children}</div>
        {actions && <div className="flex justify-end space-x-2 mt-6">{actions}</div>}
      </div>
    </>
  );
};

export default Modal; 