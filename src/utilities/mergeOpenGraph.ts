import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Pâine artizanală, fermentată lent, coaptă pe vatră. Comandă pâine cu maia naturală de la Pâine cu Maia by Virgil.',
  siteName: 'Pâine cu Maia by Virgil',
  title: 'Pâine cu Maia by Virgil',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
