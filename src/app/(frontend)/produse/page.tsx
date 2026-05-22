import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { ProductsPageClient } from './page.client'

import { isExpandedDoc } from '@/utilities/type-guards'

export const metadata: Metadata = {
  title: 'Produse | Pâine cu Maia by Virgil',
  description:
    'Descoperă gama noastră de pâine artizanală cu maia: pâine curentă, dulci și produse ocazionale.',
}

export const revalidate = 600

export default async function ProductsPage() {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft,
    limit: 100,
    overrideAccess: draft,
    where: {
      _status: { equals: 'published' },
    },
    sort: '-available,sortOrder,name',
  })

  return (
    <ProductsPageClient
      products={products.docs.map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        price: p.price,
        weight: p.weight,
        productType: p.productType,
        tags: p.tags ?? undefined,
        available: p.available ?? undefined,
        sortOrder: p.sortOrder ?? undefined,
        featuredImage: isExpandedDoc(p.featuredImage) ? p.featuredImage : null,
      }))}
    />
  )
}
