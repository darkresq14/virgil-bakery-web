import type { GlobalConfig } from 'payload'

import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { revalidateSiteConfig } from './hooks/revalidateSiteConfig'

export const SiteConfig: GlobalConfig = {
  slug: 'siteConfig',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'whatsappNumber',
      type: 'text',
      label: 'Număr WhatsApp',
      defaultValue: '+40746245391',
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Email contact',
      defaultValue: 'bucsavirgil@yahoo.com',
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: 'Telefon contact',
      defaultValue: '+40746245391',
    },
    {
      name: 'facebookUrl',
      type: 'text',
      label: 'URL Facebook',
    },
    {
      name: 'instagramUrl',
      type: 'text',
      label: 'URL Instagram',
    },
    {
      name: 'deliveryInfo',
      type: 'richText',
      label: 'Informații livrare',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
            FixedToolbarFeature(),
          ]
        },
      }),
    },
    {
      name: 'orderingProcess',
      type: 'richText',
      label: 'Cum se comandă',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
            FixedToolbarFeature(),
          ]
        },
      }),
    },
  ],
  hooks: {
    afterChange: [revalidateSiteConfig],
  },
}
