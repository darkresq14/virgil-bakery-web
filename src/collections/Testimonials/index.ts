import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { revalidateTestimonial } from './hooks/revalidateTestimonial'

export const Testimonials: CollectionConfig<'testimonials'> = {
  slug: 'testimonials',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['author', 'language', 'published', 'updatedAt'],
    useAsTitle: 'author',
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      label: 'Autor',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Conținut',
      required: true,
    },
    {
      name: 'language',
      type: 'select',
      label: 'Limbă',
      options: [
        { label: 'Română', value: 'ro' },
        { label: 'English', value: 'en' },
        { label: 'Deutsch', value: 'de' },
      ],
      required: true,
      defaultValue: 'ro',
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicat',
      defaultValue: true,
    },
  ],
  hooks: {
    afterChange: [revalidateTestimonial],
  },
}
