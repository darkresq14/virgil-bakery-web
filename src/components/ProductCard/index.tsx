'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

import type { Media } from '@/payload-types'
import { useCart } from '@/providers/Cart'
import { useToast } from '@/components/Toast'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    shortDescription?: string
    price: number
    weight?: string
    productType?: string
    tags?: string[]
    available?: boolean
    featuredImage?: Media | null
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart()
  const { showToast } = useToast()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      weight: product.weight || '',
      productType: product.productType || 'paine',
      slug: product.slug,
    })
    showToast(`${product.name} adăugat în coș`)
  }

  return (
    <Link
      href={`/produse/${product.slug}`}
      className="group flex flex-col rounded-xl bg-card shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      aria-label={`${product.name} — ${new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(product.price)}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.featuredImage?.url ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center" role="img" aria-label={product.name}>
            <span className="text-4xl" aria-hidden="true">🍞</span>
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-sans font-medium text-sm bg-black/60 px-3 py-1 rounded-full">
              Indisponibil
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading text-lg mb-1">{product.name}</h3>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground font-sans mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <div className="font-sans">
            <span className="text-lg font-semibold text-primary">
              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(product.price)}
            </span>
            {product.weight && (
              <span className="text-sm text-muted-foreground ml-1">/ {product.weight}</span>
            )}
          </div>
          {product.available !== false && (
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label={`Adaugă ${product.name} în coș`}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
