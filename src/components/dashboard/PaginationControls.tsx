import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasMore: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hasMore,
  loading = false,
  onPageChange,
  onNextPage,
  onPrevPage,
  className = ''
}: PaginationControlsProps) {
  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate start and end of visible range
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // Add pages to range
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add visible pages
    rangeWithDots.push(...range);

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
        {totalItems.toLocaleString()} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage <= 1 || loading}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`dots-${index}`} className="px-2">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                disabled={loading}
                className={`min-w-[40px] ${
                  isCurrentPage 
                    ? 'bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/90' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasMore || loading}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export interface InfiniteScrollTriggerProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
}

export function InfiniteScrollTrigger({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  className = ''
}: InfiniteScrollTriggerProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [hasMore, loading, onLoadMore, threshold]);

  if (!hasMore) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        No more results to load
      </div>
    );
  }

  return (
    <div ref={triggerRef} className={`text-center py-4 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading more results...</span>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={onLoadMore}
          className="hover:bg-brand-yellow/10"
        >
          Load more results
        </Button>
      )}
    </div>
  );
}

export default PaginationControls;