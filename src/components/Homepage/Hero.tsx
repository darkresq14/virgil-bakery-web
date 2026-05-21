import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface HeroProps {
  heading: string
  subheading?: string
  backgroundImage?: {
    url: string
    alt?: string
    width?: number
    height?: number
  } | null
}

export const Hero: React.FC<HeroProps> = ({ heading, subheading, backgroundImage }) => {
  return (
    <section className="relative h-screen min-h-150 flex items-center justify-center overflow-hidden">
      {backgroundImage?.url && (
        <Image
          src={backgroundImage.url}
          alt={backgroundImage.alt || heading}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 drop-shadow-lg">
          {heading}
        </h1>
        {subheading && (
          <p className="text-lg md:text-xl font-serif max-w-2xl mx-auto mb-8 drop-shadow-md">
            {subheading}
          </p>
        )}
        <Link
          href="/produse"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 text-base font-sans font-medium hover:bg-primary/90 transition-colors"
        >
          Vezi produsele
        </Link>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/70" />
      </div>
    </section>
  )
}
