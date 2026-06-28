import config from '@payload-config';
import { unstable_cache } from 'next/cache';
import { getServerSideSitemap } from 'next-sitemap';
import { getPayload } from 'payload';

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config });
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com';

    const results = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const dateFallback = new Date().toISOString();

    // `/produse` is emitted by products-sitemap.xml (the products listing), so we
    // don't duplicate it here. `/posts` has no index entry anywhere else, so it's
    // declared here. lastmod is omitted for these listing routes — there's no
    // honest modified-date for them, and stamping the build time would make them
    // look perpetually fresh to crawlers.
    const defaultSitemap = [
      {
        loc: `${SITE_URL}/posts`,
      },
    ];

    const sitemap = results.docs
      ? results.docs
          .filter((page) => Boolean(page?.slug))
          .map((page) => {
            return {
              loc: page?.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page?.slug}`,
              lastmod: page.updatedAt || dateFallback,
            };
          })
      : [];

    return [...defaultSitemap, ...sitemap];
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
);

export async function GET() {
  const sitemap = await getPagesSitemap();

  return getServerSideSitemap(sitemap);
}
