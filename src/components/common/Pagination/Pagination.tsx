import React from 'react';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  maxVisiblePages = 5,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label="Pagination">
      <ul className={styles.paginationList}>
        <li>
          <button
            className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            type="button"
          >
            ← Previous
          </button>
        </li>

        {pages.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className={styles.ellipsis}>...</span>
            ) : (
              <button
                className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                disabled={typeof page === 'string'}
                type="button"
              >
                {page}
              </button>
            )}
          </li>
        ))}

        <li>
          <button
            className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            type="button"
          >
            Next →
          </button>
        </li>
      </ul>
    </nav>
  );
};
