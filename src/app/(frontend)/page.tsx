import configPromise from '@payload-config'
import { CreditCard, Mail, MapPin, MessageCircle, Phone, ShoppingCart, Truck } from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'
import { About } from '@/components/Homepage/About'
import { Hero } from '@/components/Homepage/Hero'
import { Testimonials } from '@/components/Homepage/Testimonials'
import { ProductCard } from '@/components/ProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { isExpandedDoc } from '@/utilities/type-guards'

export const revalidate = 600

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
    sort: '-available,sortOrder,name',
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
        <ScrollReveal>
          <About
            heading={homepage.aboutHeading}
            description={homepage.aboutDescription}
            image1={isExpandedDoc(aboutImg1) ? aboutImg1 : null}
            image2={isExpandedDoc(aboutImg2) ? aboutImg2 : null}
          />
        </ScrollReveal>
      )}

      {/* Featured Products */}
      {featuredProducts.docs.length > 0 && (
        <ScrollReveal>
          <section className="py-20">
            <div className="container">
              <h2 className="text-3xl font-heading text-center mb-12">Produse recomandate</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.docs.map((product, i) => (
                  <ScrollReveal key={product.id} delay={i * 100}>
                    <ProductCard
                      product={{
                        id: String(product.id),
                        name: product.name,
                        slug: product.slug,
                        shortDescription: product.shortDescription,
                        price: product.price,
                        weight: product.weight,
                        productType: product.productType,
                        tags: product.tags ?? undefined,
                        available: product.available ?? undefined,
                        featuredImage: isExpandedDoc(product.featuredImage)
                          ? product.featuredImage
                          : null,
                      }}
                    />
                  </ScrollReveal>
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
        </ScrollReveal>
      )}

      {/* Testimonials */}
      {testimonials.docs.length > 0 && (
        <ScrollReveal>
          <Testimonials
            testimonials={testimonials.docs.map((t) => ({
              id: String(t.id),
              author: t.author,
              content: t.content,
              language: t.language,
            }))}
          />
        </ScrollReveal>
      )}

      {/* Ordering Info Teaser */}
      <ScrollReveal>
        <section className="py-20 bg-white">
          <div className="container">
            <h2 className="text-3xl font-heading text-center mb-12">Cum funcționează</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card: Comandă Online */}
              <Link
                href="/cum-comand"
                className="group flex flex-col items-center text-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">Comandă Online</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {siteConfig?.teaserOrdering || 'Alege produsele dorite direct din magazinul online.'}
                </p>
              </Link>

              {/* Card: Livrare */}
              <Link
                href="/cum-comand#livrare"
                className="group flex flex-col items-center text-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">Livrare</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {siteConfig?.teaserDelivery || 'Livrăm în Brașov, Sibiu, București și în toată țara.'}
                </p>
              </Link>

              {/* Card: Plată */}
              <Link
                href="/cum-comand#plata"
                className="group flex flex-col items-center text-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">Plată</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {siteConfig?.teaserPayment || 'POS, transfer bancar sau plata la livrare.'}
                </p>
              </Link>

              {/* Card: WhatsApp */}
              <a
                href={siteConfig?.whatsappGroupUrl || `https://wa.me/${siteConfig?.whatsappNumber?.replace(/[^0-9]/g, '') || '40746245391'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center text-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-4 group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="font-heading text-lg mb-2">WhatsApp</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {siteConfig?.teaserWhatsapp || 'Alătură-te grupului nostru pentru oferte și comenzi rapide.'}
                </p>
              </a>
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link
                href="/cum-comand"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary text-primary px-8 py-3 font-sans font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Află detalii complete
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Contact */}
      <ScrollReveal>
        <section id="contact" className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-t from-secondary/50 to-transparent" />
          <div className="container text-center relative">
            <span className="inline-block text-sm font-sans uppercase tracking-[0.2em] text-primary/60 mb-3">
              Hai să vorbim
            </span>
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
                className="inline-flex items-center gap-2 mt-8 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] hover:shadow-lg hover:shadow-[#25D366]/25 hover:scale-105 transition-all"
              >
                Scrie-ne pe WhatsApp
              </a>
            )}
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
