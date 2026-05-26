import { getServerSideURL } from './getURL'
import type { Product } from '@/payload-types'

export function localBusinessSchema(args: {
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  url?: string
}) {
  const url = args.url || getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: args.name,
    url,
    ...(args.phone && { telephone: args.phone }),
    ...(args.email && { email: args.email }),
    ...(args.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: args.address,
        addressCountry: 'RO',
      },
    }),
  }
}

export function productSchema(args: {
  product: Product
  url: string
}) {
  const { product, url } = args

  const image =
    typeof product.featuredImage === 'object' && product.featuredImage?.url
      ? product.featuredImage.url.startsWith('http')
        ? product.featuredImage.url
        : getServerSideURL() + product.featuredImage.url
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || undefined,
    ...(image && { image }),
    url,
    ...(product.price != null && {
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'RON',
        availability: product.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    }),
  }
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
