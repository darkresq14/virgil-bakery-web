import type { Post, Product } from '@/payload-types'
import { getServerSideURL } from './getURL'

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

export function productSchema(args: { product: Product; url: string }) {
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
  }
}

export function blogPostSchema(args: { post: Post; url: string }) {
  const { post, url } = args
  const baseUrl = getServerSideURL()

  const image =
    typeof post.heroImage === 'object' && post.heroImage?.url
      ? post.heroImage.url.startsWith('http')
        ? post.heroImage.url
        : baseUrl + post.heroImage.url
      : undefined

  const authorName = post.populatedAuthors?.[0]?.name || undefined

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
      name: 'Pâine cu Maia by Virgil',
      url: baseUrl,
    },
  }
}
