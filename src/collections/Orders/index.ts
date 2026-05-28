import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { revalidateOrder } from './hooks/revalidateOrder'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: anyone,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['id', 'customerName', 'deliveryDate', 'total', 'status', 'createdAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'items',
      type: 'json',
      required: true,
      admin: {
        components: {
          Cell: '@/collections/Orders/components/ItemsCell#ItemsCell',
        },
      },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'deliveryDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'customerName',
      type: 'text',
      label: 'Nume client',
    },
    {
      name: 'customerPhone',
      type: 'text',
      label: 'Telefon client',
    },
    {
      name: 'customerAddress',
      type: 'textarea',
      label: 'Adresă livrare',
    },
    {
      name: 'whatsappMessage',
      type: 'textarea',
      label: 'Mesaj WhatsApp',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'nou',
      options: [
        { label: 'Nou', value: 'nou' },
        { label: 'Confirmat', value: 'confirmat' },
        { label: 'Livrat', value: 'livrat' },
        { label: 'Anulat', value: 'anulat' },
      ],
      admin: {
        components: {
          Cell: '@/collections/Orders/components/StatusCell#StatusCell',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateOrder],
  },
}
