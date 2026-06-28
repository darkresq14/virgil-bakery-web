import type { Post, Product } from '@/payload-types';
import { COURIER_SHIPPING_COST } from './detectDeliveryMethod';
import { getServerSideURL } from './getURL';
import { BRAND_NAME } from './seoDefaults';

const CURRENCY = 'RON';
const COUNTRY = 'RO';

/** Single physical location (mirrors Homepage → Contact → Adresă). */
const LOCALITY = 'Sibiu';
const POSTAL_CODE = '557260';

/** Honest product price band for the LocalBusiness priceRange hint. */
const PRICE_RANGE = '25–40 RON';

/** Representative image reused from Open Graph (kept in /public). */
const OG_IMAGE_PATH = '/og-image.jpg';

/** Where the written policies & conditions live. */
const POLICIES_PATH = '/cum-comand';

/** A day-range value for handling/transit times in shipping details. */
const quantitativeDays = (min: number, max: number) => ({
  '@type': 'QuantitativeValue',
  minValue: min,
  maxValue: max,
  unitCode: 'DAY',
});

/**
 * Shared delivery window for both shipping methods, reflecting the fixed
 * Tuesday/Friday bake schedule (see CONTEXT.md → Delivery Date).
 *
 * Packages are dispatched the day before the delivery date (Mon→Tue / Thu→Fri),
 * so transit is ~1 day. Handling is the variable wait from order to the next
 * dispatch day, bounded by the cutoffs (Sun 17:00 for Tue, Wed 17:00 for Fri,
 * Romania time): ~1 day when ordered just before a cutoff, ~5 days when ordered
 * just after one. Total order-to-delivery ≈ 2–6 days.
 *
 * Note: schema.org cannot express weekdays or cutoff times, so this min/max
 * range is the honest proxy for the actual fixed-day schedule.
 */
const SCHEDULED_DELIVERY_TIME = {
  '@type': 'ShippingDeliveryTime',
  handlingTime: quantitativeDays(1, 5),
  transitTime: quantitativeDays(1, 1),
};

export function localBusinessSchema(args: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  url?: string;
}) {
  const url = args.url || getServerSideURL();

  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: args.name,
    url,
    image: `${url}${OG_IMAGE_PATH}`,
    priceRange: PRICE_RANGE,
    servesCuisine: ['Bakery'],
    ...(args.phone && { telephone: args.phone }),
    ...(args.email && { email: args.email }),
    address: {
      '@type': 'PostalAddress',
      ...(args.address && { streetAddress: args.address }),
      addressLocality: LOCALITY,
      postalCode: POSTAL_CODE,
      addressCountry: COUNTRY,
    },
    // Organization-level return policy (perishable food → not returnable).
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: COUNTRY,
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${url}${POLICIES_PATH}`,
    },
  };
}

export function productSchema(args: { product: Product; url: string }) {
  const { product, url } = args;

  const image =
    typeof product.featuredImage === 'object' && product.featuredImage?.url
      ? product.featuredImage.url.startsWith('http')
        ? product.featuredImage.url
        : getServerSideURL() + product.featuredImage.url
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || undefined,
    ...(image && { image }),
    url,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    ...(product.price != null && {
      offers: {
        '@type': 'Offer',
        url,
        price: product.price,
        priceCurrency: CURRENCY,
        availability: product.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        // Perishable food is not returnable for food-safety reasons.
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        },
        shippingDetails: [
          // Free personal delivery in the Sibiu area.
          {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: CURRENCY },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: COUNTRY,
              addressRegion: 'Sibiu',
            },
            deliveryTime: SCHEDULED_DELIVERY_TIME,
          },
          // National courier delivery.
          {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: COURIER_SHIPPING_COST,
              currency: CURRENCY,
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: COUNTRY,
            },
            deliveryTime: SCHEDULED_DELIVERY_TIME,
          },
        ],
      },
    }),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function blogPostSchema(args: { post: Post; url: string }) {
  const { post, url } = args;
  const baseUrl = getServerSideURL();

  const image =
    typeof post.heroImage === 'object' && post.heroImage?.url
      ? post.heroImage.url.startsWith('http')
        ? post.heroImage.url
        : baseUrl + post.heroImage.url
      : undefined;

  const authorName = post.populatedAuthors?.[0]?.name || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url,
    ...(image && { image }),
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || undefined,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: baseUrl,
    },
  };
}

export function webPageSchema(args: { title: string; url: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: args.title,
    url: args.url,
    ...(args.description && { description: args.description }),
    isPartOf: {
      '@type': 'WebSite',
      name: BRAND_NAME,
      url: getServerSideURL(),
    },
  };
}
