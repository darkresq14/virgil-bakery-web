import configPromise from '@payload-config';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next/types';
import { getPayload } from 'payload';
import { CollectionArchive } from '@/components/CollectionArchive';
import { PageRange } from '@/components/PageRange';
import { Pagination } from '@/components/Pagination';
import PageClient from './page.client';

export const revalidate = 86400;

type Args = {
  params: Promise<{
    pageNumber: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise;
  const payload = await getPayload({ config: configPromise });

  const sanitizedPageNumber = Number(pageNumber);

  if (!Number.isInteger(sanitizedPageNumber)) notFound();

  // Page 1 is the `/posts` listing. Belt-and-suspenders for the redirect in
  // redirects.ts: even if that redirect is ever removed, this route must never
  // serve a page-1 duplicate. See ADR 0005.
  if (sanitizedPageNumber === 1) notFound();

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
  });

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Blog</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise;
  return {
    title: `Blog — Pagina ${pageNumber} | Pâine cu Maia by Virgil`,
    description:
      'Articole despre pâinea cu maia, fermentația lentă și secretele brutăriei artizanale.',
    alternates: {
      canonical: `/posts/page/${pageNumber}`,
    },
  };
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const { totalDocs } = await payload.count({
    collection: 'posts',
    overrideAccess: false,
  });

  const totalPages = Math.ceil(totalDocs / 12);

  // Page 1 is the `/posts` listing itself — generating it here would produce a
  // duplicate URL (see ADR 0005). Start at page 2; `/posts/page/1` is
  // permanently redirected to `/posts` in the redirects config.
  const pages: { pageNumber: string }[] = [];

  for (let i = 2; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) });
  }

  return pages;
}
