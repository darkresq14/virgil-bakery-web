import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';
import type { ButtonProps } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utilities/ui';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);

const PaginationContent: React.FC<
  { ref?: React.Ref<HTMLUListElement> } & React.HTMLAttributes<HTMLUListElement>
> = ({ className, ref, ...props }) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} ref={ref} {...props} />
);

const PaginationItem: React.FC<
  { ref?: React.Ref<HTMLLIElement> } & React.HTMLAttributes<HTMLLIElement>
> = ({ className, ref, ...props }) => <li className={cn('', className)} ref={ref} {...props} />;

type PaginationLinkProps = {
  href?: string;
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  Omit<React.ComponentProps<'a'>, 'href'>;

/**
 * Renders a real anchor when `href` is set (crawlable; client-side navigation is
 * a progressive enhancement via next/link) and an inert `<span>` when disabled,
 * so no JavaScript handler is required to reach deeper pages. See ADR 0005.
 */
const PaginationLink = ({
  className,
  href,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => {
  const classes = cn(
    buttonVariants({
      size,
      variant: isActive ? 'outline' : 'ghost',
    }),
    className,
  );

  if (href === undefined) {
    return (
      <span
        aria-disabled="true"
        className={cn(classes, 'pointer-events-none opacity-50')}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }

  return (
    <Link aria-current={isActive ? 'page' : undefined} className={classes} href={href} {...props} />
  );
};

const PaginationPrevious = ({ className, href, ...props }: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn('gap-1 pl-2.5', className)}
    href={href}
    size="default"
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);

const PaginationNext = ({ className, href, ...props }: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn('gap-1 pr-2.5', className)}
    href={href}
    size="default"
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
