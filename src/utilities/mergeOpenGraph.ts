import type { Metadata } from 'next'

import { SITE_DESCRIPTION, SITE_TITLE } from './seoDefaults'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: SITE_DESCRIPTION,
  siteName: 'Pâine cu Maia by Virgil',
  title: SITE_TITLE,
  images: [
    {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: SITE_TITLE,
    },
  ],
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
