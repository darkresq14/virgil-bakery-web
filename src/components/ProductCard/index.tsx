'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { ImageMedia } from '@/components/Media/ImageMedia';
import { useToast } from '@/components/Toast';
import type { Media } from '@/payload-types';
import { useCart } from '@/providers/Cart';
import {
  type AvailableDays,
  badgeDeliveryLabel,
  inlineDeliveryLabel,
  isEffectivelyPurchaseable,
} from '@/utilities/productAvailability';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    price: number;
    weight?: string;
    productType?: string;
    tags?: string[];
    available?: boolean;
    availableDays?: AvailableDays | null;
    availableOnDate?: string | null;
    /** Server-computed effective purchaseability (One-off Availability aware). */
    purchaseable?: boolean;
    featuredImage?: Media | null;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const purchaseable = product.purchaseable ?? isEffectivelyPurchaseable(product);
  const daysLabel = badgeDeliveryLabel(product);
  const deliveryLabel = inlineDeliveryLabel(product);
  const deliveryToast = deliveryLabel ? `se livrează ${deliveryLabel}` : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      weight: product.weight || '',
      productType: product.productType || 'paine',
      slug: product.slug,
      availableDays: product.availableDays ?? 'both',
      availableOnDate: product.availableOnDate ?? null,
    });
    showToast(
      deliveryToast ? `În coș: ${product.name} — ${deliveryToast}` : `În coș: ${product.name}`,
    );
  };

  return (
    <Link
      href={`/produse/${product.slug}`}
      className="group flex h-full flex-col rounded-xl bg-card shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      aria-label={`${product.name} — ${new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(product.price)}`}
    >
      <div className="relative aspect-4/3 overflow-hidden">
        {product.featuredImage?.url ? (
          <ImageMedia
            resource={product.featuredImage}
            alt={product.featuredImage.alt || product.name}
            slot="card"
            fill
            imgClassName="object-cover group-hover:scale-105 transition-transform duration-300"
            size="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full bg-secondary flex items-center justify-center"
            role="img"
            aria-label={product.name}
          >
            <span className="text-4xl" aria-hidden="true">
              🍞
            </span>
          </div>
        )}
        {/* Unavailable: dim only — the "Indisponibil" pill below the price carries the text */}
        {!purchaseable && <div className="absolute inset-0 bg-black/50" aria-hidden="true" />}
        {purchaseable && daysLabel && (
          <span className="absolute top-3 left-3 text-white font-sans font-medium text-xs bg-black/60 px-3 py-1 rounded-full">
            {daysLabel}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading text-lg mb-1">{product.name}</h3>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground font-sans mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}
        {/* Bottom slot: same shape on every card so rows of cards align
            (available = action button, unavailable = inert placeholder). */}
        <div className="mt-auto">
          <div className="font-sans mb-3">
            <span className="text-lg font-semibold text-primary">
              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(
                product.price,
              )}
            </span>
            {product.weight && (
              <span className="text-sm text-muted-foreground ml-1">/ {product.weight}</span>
            )}
          </div>
          {purchaseable ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-sans font-medium text-sm px-4 hover:bg-primary/90 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              Adaugă în coș
            </button>
          ) : (
            <span className="flex w-full h-11 items-center justify-center rounded-full bg-secondary text-muted-foreground font-sans font-medium text-sm px-4 select-none">
              Indisponibil
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
