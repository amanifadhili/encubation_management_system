import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center mt-6 gap-2">
      <button
        className="px-3 py-1 rounded bg-gray-200 text-blue-700 font-semibold hover:bg-gray-300"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      {[...Array(totalPages)].map((_, idx) => (
        <button
          key={idx}
          className={`px-3 py-1 rounded font-semibold ${page === idx + 1 ? "bg-blue-700 text-white" : "bg-gray-100 text-blue-700 hover:bg-blue-200"}`}
          onClick={() => onPageChange(idx + 1)}
        >
          {idx + 1}
        </button>
      ))}
      <button
        className="px-3 py-1 rounded bg-gray-200 text-blue-700 font-semibold hover:bg-gray-300"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination; 