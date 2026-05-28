'use client'

import { AlertCircle, ArrowLeft, Check, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import RichText from '@/components/RichText'
import { ScrollReveal } from '@/components/ScrollReveal'
import { useToast } from '@/components/Toast'
import type { Product } from '@/payload-types'
import { useCart } from '@/providers/Cart'
import { isExpandedDoc } from '@/utilities/type-guards'

const productTypeLabels: Record<string, string> = {
  paine: 'Pâine',
  bagheta: 'Baghetă',
  chifle: 'Chifle',
  focaccia: 'Focaccia',
  biscotti: 'Biscotti',
  cozonac: 'Cozonac',
  desert: 'Desert',
  saleuri: 'Saleuri',
  'set-cadou': 'Set/Cadou',
}

export const ProductDetailClient: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [selectedImage, setSelectedImage] = useState(0)

  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt?: string | null }> = []

    if (isExpandedDoc(product.featuredImage) && product.featuredImage.url) {
      images.push({ url: product.featuredImage.url!, alt: product.featuredImage.alt })
    }

    product.gallery?.forEach((item) => {
      if (isExpandedDoc(item.image) && item.image.url) {
        images.push({ url: item.image.url!, alt: item.image.alt })
      }
    })

    return images
  }, [product.featuredImage, product.gallery])

  const handleAddToCart = () => {
    addItem({
      productId: String(product.id),
      name: product.name,
      price: product.price,
      weight: product.weight || '',
      productType: product.productType || 'paine',
      slug: product.slug,
    })
    showToast(`${product.name} adăugat în coș`)
  }

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { label: 'Acasă', href: '/' },
          { label: 'Produse', href: '/produse' },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <ScrollReveal>
          <div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
              {allImages[selectedImage]?.url ? (
                <Image
                  src={allImages[selectedImage].url}
                  alt={allImages[selectedImage].alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🍞</span>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-4">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Details */}
        <ScrollReveal delay={150}>
          <div>
            {product.productType && (
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-sans font-medium text-muted-foreground mb-3">
                {productTypeLabels[product.productType] || product.productType}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-heading mb-2">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-lg text-muted-foreground font-serif mb-4">
                {product.shortDescription}
              </p>
            )}

            {/* Price & Weight */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-sans font-bold text-primary">
                {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(
                  product.price,
                )}
              </span>
              {product.weight && (
                <span className="text-sm text-muted-foreground font-sans">{product.weight}</span>
              )}
            </div>

            {/* Availability */}
            {product.available === false && (
              <div className="flex items-center gap-2 text-destructive font-sans text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {product.availabilityText || 'Momentan indisponibil'}
              </div>
            )}
            {product.available !== false && product.availabilityText && (
              <div className="flex items-center gap-2 text-muted-foreground font-sans text-sm mb-4">
                <Check className="w-4 h-4" />
                {product.availabilityText}
              </div>
            )}

            {/* Add to cart */}
            {product.available !== false && (
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 font-sans font-medium hover:bg-primary/90 transition-colors mb-8"
              >
                <ShoppingBag className="w-5 h-5" />
                Adaugă în coș
              </button>
            )}

            {/* Intro */}
            {product.introProduct && (
              <p className="font-serif text-foreground/80 mb-6">{product.introProduct}</p>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <RichText data={product.description} enableGutter={false} enableProse={true} />
              </div>
            )}

            {/* Characteristics */}
            {product.characteristics && product.characteristics.length > 0 && (
              <div className="mb-6">
                <h3 className="font-heading text-lg mb-3">Caracteristici</h3>
                <ul className="space-y-1 font-sans text-sm">
                  {product.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {c.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mb-6">
                <h3 className="font-heading text-lg mb-2">Ingrediente</h3>
                <p className="font-sans text-sm text-muted-foreground">{product.ingredients}</p>
              </div>
            )}

            {/* Allergens */}
            {product.allergens && (
              <div className="mb-6">
                <h3 className="font-heading text-lg mb-2">Alergeni</h3>
                <p className="font-sans text-sm text-muted-foreground">{product.allergens}</p>
              </div>
            )}

            {/* Nutritional values */}
            {product.nutritionalValues && (
              <div className="mb-6">
                <h3 className="font-heading text-lg mb-2">Valori nutriționale</h3>
                <RichText
                  data={product.nutritionalValues}
                  enableGutter={false}
                  enableProse={true}
                />
              </div>
            )}

            {/* Ordering info */}
            {product.orderingInfo && (
              <div className="mb-6 rounded-lg bg-secondary/50 p-4">
                <RichText data={product.orderingInfo} enableGutter={false} enableProse={true} />
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Back link */}
      <div className="mt-12">
        <Link
          href="/produse"
          className="inline-flex items-center gap-2 text-muted-foreground font-sans text-sm hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi la produse
        </Link>
      </div>
    </div>
  )
}
