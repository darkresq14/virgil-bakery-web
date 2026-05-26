import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coșul tău | Pâine cu Maia by Virgil',
  robots: { index: false, follow: true },
}

export { CartPageClient as default } from './page.client'
