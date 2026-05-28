'use client'

import type React from 'react'
import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'

import type { Media } from '@/payload-types'

interface Product {
  id: string
  name: string
  slug: string
  shortDescription?: string
  price: number
  weight?: string
  productType?: string
  tags?: string[]
  available?: boolean
  sortOrder?: number
  featuredImage?: Media | null
}

const typeFilters = [
  { value: 'all', label: 'Toate' },
  { value: 'paine', label: 'Pâine' },
  { value: 'bagheta', label: 'Baghete' },
  { value: 'chifle', label: 'Chifle' },
  { value: 'focaccia', label: 'Focaccia' },
  { value: 'biscotti', label: 'Biscotti' },
  { value: 'cozonac', label: 'Cozonac' },
  { value: 'desert', label: 'Desert' },
  { value: 'saleuri', label: 'Saleuri' },
  { value: 'set-cadou', label: 'Set/Cadou' },
]

const typeOrder: Record<string, number> = {
  paine: 1,
  bagheta: 2,
  chifle: 3,
  focaccia: 4,
  biscotti: 5,
  cozonac: 6,
  desert: 7,
  saleuri: 8,
  'set-cadou': 9,
}

export const ProductsPageClient: React.FC<{ products: Product[] }> = ({ products }) => {
  const [activeType, setActiveType] = useState('all')

  const filtered = useMemo(() => {
    let result = products

    if (activeType !== 'all') {
      result = result.filter((p) => p.productType === activeType)
    }

    return result.sort((a, b) => {
      // Available products first
      const aAvail = a.available ? 0 : 1
      const bAvail = b.available ? 0 : 1
      if (aAvail !== bAvail) return aAvail - bAvail

      // Group by product type order
      const aType = a.productType ? (typeOrder[a.productType] ?? 99) : 99
      const bType = b.productType ? (typeOrder[b.productType] ?? 99) : 99
      if (aType !== bType) return aType - bType

      // Then by sortOrder
      const aSort = a.sortOrder ?? 0
      const bSort = b.sortOrder ?? 0
      if (aSort !== bSort) return aSort - bSort

      // Then alphabetically
      return a.name.localeCompare(b.name, 'ro')
    })
  }, [products, activeType])

  return (
    <div className="py-12">
      <div className="container">
        <ScrollReveal>
          <h1 className="text-3xl md:text-4xl font-heading text-center mb-8">Produsele noastre</h1>
        </ScrollReveal>

        {/* Type filters */}
        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveType(filter.value)}
                className={`rounded-full px-5 py-2 text-sm font-sans font-medium transition-colors ${
                  activeType === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Products grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product, i) => (
              <ScrollReveal key={product.id} delay={Math.min(i * 80, 400)}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground font-sans py-12">
            Nu am găsit produse care să corespundă filtrelor selectate.
          </p>
        )}
      </div>
    </div>
  )
}
