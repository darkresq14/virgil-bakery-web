import config from '@payload-config';
import { unstable_cache } from 'next/cache';
import { getServerSideSitemap } from 'next-sitemap';
import { getPayload } from 'payload';
import { getServerSideURL } from '@/utilities/getURL';

const getProductsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config });
    const SITE_URL = getServerSideURL();

    const [products, dateFallback] = await Promise.all([
      payload.find({
        collection: 'products',
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
      }),
      new Date().toISOString(),
    ]);

    const defaultSitemap = [
      {
        loc: `${SITE_URL}/produse`,
        lastmod: dateFallback,
      },
    ];

    const sitemap = products.docs
      ? products.docs
          .filter((product) => Boolean(product?.slug))
          .map((product) => ({
            loc: `${SITE_URL}/produse/${product?.slug}`,
            lastmod: product.updatedAt || dateFallback,
          }))
      : [];

    return [...defaultSitemap, ...sitemap];
  },
  ['products-sitemap'],
  {
    tags: ['products-sitemap'],
  },
);

export async function GET() {
  const sitemap = await getProductsSitemap();

  return getServerSideSitemap(sitemap);
}
