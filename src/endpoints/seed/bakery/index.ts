import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

import { products, type ProductSeedData } from './products'
import { testimonials } from './testimonials'
import { blogPost } from './blog-post'
import { privacyPolicyPage, maiauaMeaPage } from './pages'
import { siteConfigData, homepageData } from './globals'
import { readLocalFile, textToLexical } from './helpers'

const collections: CollectionSlug[] = [
  'products',
  'testimonials',
  'media',
  'pages',
  'posts',
]

const globals: GlobalSlug[] = ['siteConfig', 'homepage']

export const bakerySeed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding bakery data...')

  // ── Clear existing bakery data ──
  payload.logger.info('— Clearing collections and globals...')

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection]?.config?.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  // ── Step 1: Upload product images ──
  payload.logger.info('— Uploading product images...')

  const uniqueImages = [...new Set(products.map((p) => p.imageFile))]
  const mediaMap = new Map<string, any>()

  for (const imageFile of uniqueImages) {
    try {
      const file = readLocalFile(imageFile)
      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt: imageFile.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') },
        file,
        depth: 0,
        context: { disableRevalidate: true },
      })
      mediaMap.set(imageFile, mediaDoc)
    } catch (e) {
      payload.logger.error(`Failed to upload image ${imageFile}: ${e}`)
    }
  }

  // Upload hero images
  const heroImages = [
    'home_baker2_pic23-3.jpg',
    'home_baker2_pic1-3.jpg',
    'poza-6.jpg',
    'poza-5.jpg',
  ]
  const heroMediaMap = new Map<string, any>()
  for (const imageFile of heroImages) {
    try {
      const file = readLocalFile(imageFile)
      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt: imageFile.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') },
        file,
        depth: 0,
        context: { disableRevalidate: true },
      })
      heroMediaMap.set(imageFile, mediaDoc)
    } catch (e) {
      payload.logger.error(`Failed to upload hero image ${imageFile}: ${e}`)
    }
  }

  // Upload logo files
  const logoFiles = [
    { file: 'Logo-Gilu-mare-2.png', alt: 'Logo Virgil Bakery' },
    { file: 'Logo-Gilu-Footer.png', alt: 'Logo Footer' },
    { file: 'Fav-Icon.png', alt: 'Favicon' },
  ]
  const logoMediaMap = new Map<string, any>()
  for (const { file: fileName, alt } of logoFiles) {
    try {
      const file = readLocalFile(fileName)
      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt },
        file,
        depth: 0,
        context: { disableRevalidate: true },
      })
      logoMediaMap.set(fileName, mediaDoc)
    } catch (e) {
      payload.logger.error(`Failed to upload logo ${fileName}: ${e}`)
    }
  }

  payload.logger.info(`— Uploaded ${mediaMap.size + heroMediaMap.size + logoMediaMap.size} media files`)

  // ── Step 2: Create products ──
  payload.logger.info('— Creating products...')

  for (const product of products) {
    const imageDoc = mediaMap.get(product.imageFile)
    if (!imageDoc) {
      payload.logger.warn(`Skipping product ${product.name} — image not found`)
      continue
    }

    const productData: Record<string, any> = {
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      category: product.category,
      available: product.available,
      featured: product.featured,
      weight: product.weight,
      price: product.price,
      featuredImage: imageDoc.id,
      _status: 'published',
    }

    if (product.introProduct) productData.introProduct = product.introProduct
    if (product.availabilityText) productData.availabilityText = product.availabilityText

    if (product.description) {
      productData.description = textToLexical(product.description)
    }

    if (product.characteristics) {
      productData.characteristics = product.characteristics.map((value) => ({ value }))
    }

    if (product.ingredients) productData.ingredients = product.ingredients
    if (product.allergens) productData.allergens = product.allergens

    if (product.nutritionalValues) {
      productData.nutritionalValues = textToLexical(product.nutritionalValues)
    }

    await payload.create({
      collection: 'products',
      data: productData as any,
      depth: 0,
      draft: false,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(`— Created ${products.length} products`)

  // ── Step 3: Create testimonials ──
  payload.logger.info('— Creating testimonials...')

  for (const testimonial of testimonials) {
    await payload.create({
      collection: 'testimonials',
      data: {
        ...testimonial,
      } as any,
      depth: 0,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(`— Created ${testimonials.length} testimonials`)

  // ── Step 4: Create blog post ──
  payload.logger.info('— Creating blog post...')

  // Get or create a user for the blog post author
  const authorResult = await payload.find({
    collection: 'users',
    limit: 1,
    depth: 0,
  })

  const postData: Record<string, any> = {
    title: blogPost.title,
    slug: blogPost.slug,
    content: blogPost.content,
    _status: 'published',
    publishedAt: new Date('2026-04-18').toISOString(),
  }

  if (authorResult.docs.length > 0) {
    postData.authors = [authorResult.docs[0].id]
  }

  await payload.create({
    collection: 'posts',
    data: postData as any,
    depth: 0,
    draft: false,
    context: { disableRevalidate: true },
  })

  payload.logger.info('— Created blog post')

  // ── Step 5: Create static pages ──
  payload.logger.info('— Creating static pages...')

  await payload.create({
    collection: 'pages',
    data: privacyPolicyPage as any,
    depth: 0,
    draft: false,
    context: { disableRevalidate: true },
  })

  await payload.create({
    collection: 'pages',
    data: maiauaMeaPage as any,
    depth: 0,
    draft: false,
    context: { disableRevalidate: true },
  })

  payload.logger.info('— Created 2 static pages')

  // ── Step 6: Populate siteConfig global ──
  payload.logger.info('— Populating siteConfig global...')

  await payload.updateGlobal({
    slug: 'siteConfig',
    data: siteConfigData as any,
    context: { disableRevalidate: true },
  })

  payload.logger.info('— siteConfig populated')

  // ── Step 7: Populate homepage global ──
  payload.logger.info('— Populating homepage global...')

  const heroImageDoc = heroMediaMap.get('home_baker2_pic23-3.jpg')
  const aboutImage1Doc = heroMediaMap.get('poza-6.jpg')
  const aboutImage2Doc = heroMediaMap.get('poza-5.jpg')

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      ...homepageData,
      heroBackgroundImage: heroImageDoc?.id || null,
      aboutImage1: aboutImage1Doc?.id || null,
      aboutImage2: aboutImage2Doc?.id || null,
    } as any,
    context: { disableRevalidate: true },
  })

  payload.logger.info('— homepage populated')

  payload.logger.info('Bakery seed completed successfully!')
}
