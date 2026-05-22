'use client'

import React, { useState } from 'react'
import { ProductCard } from '@/components/ProductCard'

import type { Media } from '@/payload-types'

interface Product {
  id: string
  name: string
  slug: string
  shortDescription?: string
  price: number
  weight?: string
  category?: string
  available?: boolean
  featuredImage?: Media | null
}

const filters = [
  { value: 'all', label: 'Toate' },
  { value: 'regular', label: 'Curente' },
  { value: 'sweet', label: 'Dulci' },
  { value: 'occasional', label: 'Ocazionale' },
]

export const ProductsPageClient: React.FC<{ products: Product[] }> = ({ products }) => {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered =
    activeFilter === 'all' ? products : products.filter((p) => p.category === activeFilter)

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-3xl md:text-4xl font-heading text-center mb-8">Produsele noastre</h1>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-full px-5 py-2 text-sm font-sans font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground font-sans py-12">
            Nu am găsit produse în această categorie.
          </p>
        )}
      </div>
    </div>
  )
}
