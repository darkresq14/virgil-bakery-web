import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import RichText from '@/components/RichText'

import { Media } from '@/payload-types'

type RichTextData = Parameters<typeof RichText>[0]['data'] | null

interface AboutProps {
  heading?: RichTextData
  description?: RichTextData
  image1?: Media | null
  image2?: Media | null
}

export const About: React.FC<AboutProps> = ({ heading, description, image1, image2 }) => {
  if (!heading && !description) return null

  return (
    <section className="py-20 bg-white">
      <div className="container">
        {heading && (
          <div className="text-center mb-12">
            <RichText data={heading} enableGutter={false} enableProse={true} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {description && <RichText data={description} enableGutter={false} enableProse={true} />}
            <Link
              href="/maiaua-mea"
              className="inline-flex items-center mt-6 text-primary font-sans font-medium hover:underline"
            >
              Află mai multe despre maiaua mea →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {image1?.url && (
              <div className="relative aspect-3/4 rounded-lg overflow-hidden">
                <Image
                  src={image1.url}
                  alt={image1.alt || 'Despre Virgil'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            )}
            {image2?.url && (
              <div className="relative aspect-3/4 rounded-lg overflow-hidden mt-8">
                <Image
                  src={image2.url}
                  alt={image2.alt || 'Despre Virgil'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
