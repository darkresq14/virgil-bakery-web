import type { GlobalConfig } from 'payload'
import { defaultLexical } from '@/fields/defaultLexical'
import { revalidateSiteConfig } from './hooks/revalidateSiteConfig'

export const SiteConfig: GlobalConfig = {
  slug: 'siteConfig',
  versions: {
    max: 20,
  },
  access: {
    read: () => true,
  },
  fields: [
    // ── Contact & Social ──────────────────────────────────────────
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

    // ── Comandă & Livrare ─────────────────────────────────────────
    {
      name: 'orderingSteps',
      type: 'array',
      label: 'Pași comandare',
      admin: {
        initCollapsed: true,
        description:
          'Pașii afișați pe pagina "Cum Comanzi". Fiecare pas primește automat un număr.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Titlu pas',
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          label: 'Descriere pas',
        },
      ],
    },
    {
      name: 'deliveryCourier',
      type: 'richText',
      label: 'Livrare prin curier',
      editor: defaultLexical,
    },
    {
      name: 'deliveryPersonal',
      type: 'richText',
      label: 'Livrare personală',
      editor: defaultLexical,
    },
    {
      name: 'paymentMethods',
      type: 'richText',
      label: 'Metode de plată',
      editor: defaultLexical,
    },
    {
      name: 'whatsappGroupUrl',
      type: 'text',
      label: 'URL grup WhatsApp',
      admin: {
        description: 'Linkul de join la grupul de WhatsApp (https://chat.whatsapp.com/...)',
      },
    },
    {
      name: 'policies',
      type: 'richText',
      label: 'Politici & condiții',
      editor: defaultLexical,
    },

    // ── Teaser cards (homepage) ───────────────────────────────────
    {
      name: 'teaserOrdering',
      type: 'text',
      label: 'Teaser: Comandă Online',
      admin: {
        description: 'Text scurt pentru cardul de pe pagina principală (~120 caractere)',
      },
    },
    {
      name: 'teaserDelivery',
      type: 'text',
      label: 'Teaser: Livrare',
      admin: {
        description: 'Text scurt pentru cardul de pe pagina principală (~120 caractere)',
      },
    },
    {
      name: 'teaserPayment',
      type: 'text',
      label: 'Teaser: Plată',
      admin: {
        description: 'Text scurt pentru cardul de pe pagina principală (~120 caractere)',
      },
    },
    {
      name: 'teaserWhatsapp',
      type: 'text',
      label: 'Teaser: WhatsApp',
      admin: {
        description: 'Text scurt pentru cardul de pe pagina principală (~120 caractere)',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSiteConfig],
  },
}
