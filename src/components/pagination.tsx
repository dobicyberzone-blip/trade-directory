'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Number of page links to show
    
    // Determine the start page of the current block
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;

    for (let i = 0; i < maxPagesToShow; i++) {
      const pageNumber = startPage + i;
      if (pageNumber > totalPages) {
        break;
      }
      pages.push(pageNumber);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-4 md:gap-6 mt-12 text-sm", className)}>
        {currentPage > 1 && (
             <Button
                variant="link"
                onClick={handlePrevious}
                className="text-primary font-medium"
            >
                Previous
            </Button>
        )}

      <div className="flex items-center gap-4">
        {pageNumbers.map((page, index) => (
          page === currentPage ? (
            <span key={index} className="text-foreground font-bold px-2">
              {page}
            </span>
          ) : (
            <Button
                key={index}
                variant="link"
                onClick={() => onPageChange(page)}
                className="text-muted-foreground hover:text-primary p-0 px-2 font-normal"
            >
                {page}
            </Button>
          )
        ))}
      </div>

      {pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < totalPages && (
            <Button
                variant="link"
                onClick={handleNext}
                className="text-primary font-medium"
            >
                Next
            </Button>
      )}
    </div>
  );
}
