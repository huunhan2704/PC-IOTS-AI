import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => {
        // Show window around current page
        if (totalPages > 7) {
          if (p !== 0 && p !== totalPages - 1 && Math.abs(p - currentPage) > 1) {
            if (p === 1 || p === totalPages - 2) {
              return (
                <span key={p} className="px-2 text-slate-600">
                  ...
                </span>
              );
            }
            return null;
          }
        }

        const isActive = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-semibold transition ${
              isActive
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {p + 1}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
