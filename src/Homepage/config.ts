import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { GlobalConfig } from 'payload'
import { revalidateHomepage } from './hooks/revalidateHomepage'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  versions: {
    max: 20,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'heroHeading',
              type: 'text',
              label: 'Titlu hero',
              required: true,
              defaultValue: 'Pâine cu Maia by Virgil',
            },
            {
              name: 'heroSubheading',
              type: 'text',
              label: 'Subtitlu hero',
              defaultValue: 'Pâine artizanală, fermentată lent, coaptă pe vatră',
            },
            {
              name: 'heroBackgroundImage',
              type: 'upload',
              label: 'Imagine fundal hero',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Despre mine',
          fields: [
            {
              name: 'aboutHeading',
              type: 'richText',
              label: 'Titlu secțiune despre',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                    FixedToolbarFeature(),
                  ]
                },
              }),
            },
            {
              name: 'aboutDescription',
              type: 'richText',
              label: 'Descriere despre mine',
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
              name: 'aboutImage1',
              type: 'upload',
              label: 'Imagine despre 1',
              relationTo: 'media',
            },
            {
              name: 'aboutImage2',
              type: 'upload',
              label: 'Imagine despre 2',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contactSection',
              type: 'group',
              label: 'Secțiune contact',
              fields: [
                {
                  name: 'address',
                  type: 'text',
                  label: 'Adresă',
                },
                {
                  name: 'deliverySchedule',
                  type: 'text',
                  label: 'Program livrare',
                },
              ],
            },
          ],
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
  ],
  hooks: {
    afterChange: [revalidateHomepage],
  },
}
