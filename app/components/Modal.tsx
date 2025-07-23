import React from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, open, onClose, children, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded shadow-lg w-full max-w-md md:max-w-lg mx-2 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
          <button onClick={onClose} className="text-2xl text-blue-700 font-bold hover:text-blue-900">&times;</button>
        </div>
        <div>{children}</div>
        {actions && <div className="flex justify-end space-x-2 mt-6">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal; 