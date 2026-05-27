import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`font-sans text-sm text-muted-foreground mb-8${className ? ` ${className}` : ''}`}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li
              key={i}
              className={`flex items-center gap-1.5${isLast && !item.href ? ' min-w-0' : ''}`}
            >
              {i > 0 && (
                <span aria-hidden="true" className="opacity-40 shrink-0">
                  ›
                </span>
              )}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors shrink-0">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground truncate" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
