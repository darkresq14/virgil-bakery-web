import type React from 'react';
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/utilities/ui';

/**
 * Page 1 is the `/posts` listing itself; `/posts/page/1` is permanently
 * redirected away (see ADR 0005). So the canonical href for page 1 is `/posts`.
 */
const pageHref = (page: number): string => (page <= 1 ? '/posts' : `/posts/page/${page}`);

export const Pagination: React.FC<{
  className?: string;
  page: number;
  totalPages: number;
}> = (props) => {
  const { className, page, totalPages } = props;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const hasExtraPrevPages = page - 1 > 1;
  const hasExtraNextPages = page + 1 < totalPages;

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={hasPrevPage ? pageHref(page - 1) : undefined} />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink href={pageHref(page - 1)}>{page - 1}</PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink isActive href={pageHref(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink href={pageHref(page + 1)}>{page + 1}</PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext href={hasNextPage ? pageHref(page + 1) : undefined} />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  );
};
