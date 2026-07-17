'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  perPage: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  const pages: (number | '...')[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

  if (startPage > 1) { pages.push(1); if (startPage > 2) pages.push('...'); }
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages) { if (endPage < totalPages - 1) pages.push('...'); pages.push(totalPages); }

  return (
    <div className="table-footer">
      <div className="showing-info">
        Affichage de {start} à {end} sur {totalItems} entrées
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            <i className="fas fa-chevron-left" />
          </button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`page-btn${currentPage === p ? ' active' : ''}`}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </button>
            )
          )}
          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
