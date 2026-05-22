import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidateProduct } from './hooks/revalidateProduct'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'

export const Products: CollectionConfig<'products'> = {
  slug: 'products',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    name: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['name', 'slug', 'productType', 'price', 'available'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nume produs',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'shortDescription',
              type: 'text',
              label: 'Scurtă descriere',
              required: true,
            },
            {
              name: 'introProduct',
              type: 'textarea',
              label: 'Introducere produs',
            },
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    BlocksFeature({ blocks: [MediaBlock] }),
                  ]
                },
              }),
              label: 'Descriere detaliată',
            },
            {
              name: 'productType',
              type: 'select',
              label: 'Tip produs',
              options: [
                { label: 'Pâine', value: 'paine' },
                { label: 'Baghetă', value: 'bagheta' },
                { label: 'Chifle', value: 'chifle' },
                { label: 'Focaccia', value: 'focaccia' },
                { label: 'Biscotti', value: 'biscotti' },
                { label: 'Cozonac', value: 'cozonac' },
                { label: 'Desert', value: 'desert' },
                { label: 'Saleuri', value: 'saleuri' },
                { label: 'Set/Cadou', value: 'set-cadou' },
              ],
              required: true,
              defaultValue: 'paine',
            },
            {
              name: 'tags',
              type: 'select',
              label: 'Tag-uri',
              hasMany: true,
              options: [
                { label: 'Dulce', value: 'dulce' },
                { label: 'Sărat', value: 'sarat' },
                { label: 'Fără gluten', value: 'fara-gluten' },
                { label: 'Integrală', value: 'integrala' },
                { label: 'Secară', value: 'secara' },
                { label: 'Seasonal', value: 'seasonal' },
                { label: 'Cadou', value: 'cadou' },
                { label: 'Ornamental', value: 'ornamental' },
              ],
            },
            {
              name: 'sortOrder',
              type: 'number',
              label: 'Ordine sortare',
              defaultValue: 0,
              admin: {
                description: 'Număr mai mic = apare primul în tipul său',
              },
            },
            {
              name: 'available',
              type: 'checkbox',
              label: 'Disponibil',
              defaultValue: true,
            },
            {
              name: 'availabilityText',
              type: 'text',
              label: 'Text disponibilitate',
              admin: {
                description: 'Ex: "Disponibil vineri"',
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              label: 'Produs recomandat',
              defaultValue: false,
            },
          ],
          label: 'General',
        },
        {
          fields: [
            {
              name: 'characteristics',
              type: 'array',
              label: 'Caracteristici',
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'ingredients',
              type: 'textarea',
              label: 'Ingrediente',
            },
            {
              name: 'allergens',
              type: 'textarea',
              label: 'Alergeni',
            },
            {
              name: 'nutritionalValues',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
                    FixedToolbarFeature(),
                  ]
                },
              }),
              label: 'Valori nutriționale',
            },
          ],
          label: 'Detalii',
        },
        {
          fields: [
            {
              name: 'featuredImage',
              type: 'upload',
              label: 'Imagine principală',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Galerie imagini',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
          ],
          label: 'Media',
        },
        {
          fields: [
            {
              name: 'weight',
              type: 'text',
              label: 'Greutate',
              required: true,
              admin: {
                description: 'Ex: "800g", "1kg", "Set 5 buc"',
              },
            },
            {
              name: 'price',
              type: 'number',
              label: 'Preț (RON)',
              required: true,
              min: 0,
            },
            {
              name: 'orderingInfo',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                  ]
                },
              }),
              label: 'Informații comandă',
            },
          ],
          label: 'Comandare',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateProduct],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
