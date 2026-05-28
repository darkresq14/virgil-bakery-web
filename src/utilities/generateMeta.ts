import type { Metadata } from 'next'

import type { Config, Media, Page, Post, Product } from '../payload-types'
import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = `${serverUrl}/icon-512.png`

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    if (ogUrl) {
      url = ogUrl.startsWith('http') ? ogUrl : serverUrl + ogUrl
    } else if (image.url) {
      url = image.url.startsWith('http') ? image.url : serverUrl + image.url
    }
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | Partial<Product> | null
  pathPrefix?: string
}): Promise<Metadata> => {
  const { doc, pathPrefix = '' } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? `${doc?.meta?.title} | Pâine cu Maia by Virgil`
    : 'Pâine cu Maia by Virgil'

  const description =
    doc?.meta?.description ||
    'Pâine artizanală, fermentată lent, coaptă pe vatră. Comandă pâine cu maia naturală de la Pâine cu Maia by Virgil.'

  const slug = Array.isArray(doc?.slug) ? doc.slug.join('/') : doc?.slug || ''
  const path = `${pathPrefix}/${slug}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  const serverUrl = getServerSideURL()
  const canonicalUrl = `${serverUrl}${path}`

  return {
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: canonicalUrl,
    }),
    title,
  }
}
