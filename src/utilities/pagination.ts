/**
 * Page size for the posts archive listing and its paginated routes.
 *
 * Single source of truth so the `payload.find` limit, the `generateStaticParams`
 * page-count divisor, and the `PageRange` display prop can never drift apart
 * (they previously each hard-coded their own copy of the number).
 */
export const POSTS_PER_PAGE = 12;
