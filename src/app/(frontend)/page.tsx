import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { draftMode } from 'next/headers'

import { isExpandedDoc } from '@/utilities/type-guards'
import { Hero } from '@/components/Homepage/Hero'
import { About } from '@/components/Homepage/About'
import { Testimonials } from '@/components/Homepage/Testimonials'
import { ProductCard } from '@/components/ProductCard'
import RichText from '@/components/RichText'
import Link from 'next/link'
import { Phone, Mail, MapPin, Truck } from 'lucide-react'

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const homepage = await getCachedGlobal('homepage', 2)()
  const siteConfig = await getCachedGlobal('siteConfig', 1)()

  const featuredProducts = await payload.find({
    collection: 'products',
    draft,
    limit: 6,
    overrideAccess: draft,
    where: {
      and: [{ featured: { equals: true } }, { _status: { equals: 'published' } }],
    },
    sort: 'name',
  })

  const testimonials = await payload.find({
    collection: 'testimonials',
    draft,
    limit: 20,
    overrideAccess: false,
    where: {
      published: { equals: true },
    },
  })

  const heroBg = homepage?.heroBackgroundImage
  const aboutImg1 = homepage?.aboutImage1
  const aboutImg2 = homepage?.aboutImage2

  return (
    <div>
      {/* Hero */}
      <Hero
        heading={homepage?.heroHeading || 'Pâine cu Maia by Virgil'}
        subheading={homepage?.heroSubheading || undefined}
        backgroundImage={isExpandedDoc(heroBg) ? heroBg : null}
      />

      {/* About */}
      {(homepage?.aboutHeading || homepage?.aboutDescription) && (
        <About
          heading={homepage.aboutHeading}
          description={homepage.aboutDescription}
          image1={isExpandedDoc(aboutImg1) ? aboutImg1 : null}
          image2={isExpandedDoc(aboutImg2) ? aboutImg2 : null}
        />
      )}

      {/* Featured Products */}
      {featuredProducts.docs.length > 0 && (
        <section className="py-20">
          <div className="container">
            <h2 className="text-3xl font-heading text-center mb-12">Produse recomandate</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.docs.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: String(product.id),
                    name: product.name,
                    slug: product.slug,
                    shortDescription: product.shortDescription,
                    price: product.price,
                    weight: product.weight,
                    category: product.category,
                    available: product.available ?? undefined,
                    featuredImage: isExpandedDoc(product.featuredImage)
                      ? product.featuredImage
                      : null,
                  }}
                />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/produse"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary text-primary px-8 py-3 font-sans font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Vezi toate produsele
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.docs.length > 0 && (
        <Testimonials
          testimonials={testimonials.docs.map((t) => ({
            id: String(t.id),
            author: t.author,
            content: t.content,
            language: t.language,
          }))}
        />
      )}

      {/* Delivery Info */}
      {(siteConfig?.deliveryInfo || siteConfig?.orderingProcess) && (
        <section className="py-20 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {siteConfig?.deliveryInfo && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-heading">Livrare</h3>
                  </div>
                  <RichText
                    data={siteConfig.deliveryInfo}
                    enableGutter={false}
                    enableProse={true}
                  />
                </div>
              )}
              {siteConfig?.orderingProcess && (
                <div>
                  <h3 className="text-2xl font-heading mb-4">Cum se comandă</h3>
                  <RichText
                    data={siteConfig.orderingProcess}
                    enableGutter={false}
                    enableProse={true}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-20 bg-secondary/30">
        <div className="container text-center">
          <h2 className="text-3xl font-heading mb-8">Contact</h2>
          <div className="flex flex-col items-center gap-4 font-sans">
            {siteConfig?.contactPhone && (
              <a
                href={`tel:${siteConfig.contactPhone}`}
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Phone className="w-5 h-5" />
                {siteConfig.contactPhone}
              </a>
            )}
            {siteConfig?.contactEmail && (
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
                {siteConfig.contactEmail}
              </a>
            )}
            {homepage?.contactSection?.address && (
              <p className="flex items-center gap-2 text-lg text-muted-foreground">
                <MapPin className="w-5 h-5" />
                {homepage.contactSection.address}
              </p>
            )}
          </div>
          {siteConfig?.whatsappNumber && (
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] transition-colors"
            >
              Scrie-ne pe WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
