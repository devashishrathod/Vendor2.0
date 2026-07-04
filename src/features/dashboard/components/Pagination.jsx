// ─── Pagination — rows-per-page + page number controls ────────────────────
export default function Pagination({
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-50">
      {/* Rows per page */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Rows per page:</span>
        {[10, 20, 50].map((n) => (
          <button
            key={n}
            onClick={() => setRowsPerPage(n)}
            className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors border
              ${rowsPerPage === n
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors
              ${currentPage === page
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}