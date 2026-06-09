import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Pâine artizanală, fermentată lent, coaptă pe vatră. Comandă pâine cu maia naturală de la Pâine cu Maia by Virgil.',
  siteName: 'Pâine cu Maia by Virgil',
  title: 'Pâine cu Maia by Virgil — Pâine Artizanală cu Maia Naturală',
  images: [
    {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Pâine cu Maia by Virgil — Pâine Artizanală cu Maia Naturală',
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
