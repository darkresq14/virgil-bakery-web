import type { CollectionConfig } from 'payload';

import { anyone } from '../../access/anyone';
import { authenticated } from '../../access/authenticated';
import { revalidateOrder } from './hooks/revalidateOrder';
import { syncOrderToSheet } from './hooks/syncOrderToSheet';
import { validateDeliveryDate } from './hooks/validateDeliveryDate';
import { SHEET_SYNC_STATUS_OPTIONS } from './syncStatus';

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: anyone,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: [
      'id',
      'customerName',
      'deliveryMethod',
      'deliveryDate',
      'total',
      'status',
      'sheetSyncStatus',
      'createdAt',
    ],
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
      name: 'deliveryMethod',
      type: 'select',
      required: true,
      defaultValue: 'personal',
      options: [
        { label: 'Personală', value: 'personal' },
        { label: 'Curier', value: 'curier' },
      ],
      admin: {
        components: {
          Cell: '@/collections/Orders/components/DeliveryMethodCell#DeliveryMethodCell',
        },
      },
    },
    {
      name: 'shippingCost',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      defaultValue: 0,
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
      name: 'judet',
      type: 'text',
      label: 'Județ',
    },
    {
      name: 'localitate',
      type: 'text',
      label: 'Localitate',
    },
    {
      name: 'streetAddress',
      type: 'text',
      label: 'Strada + Număr',
    },
    {
      name: 'addressDetails',
      type: 'text',
      label: 'Detalii adresă',
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
    {
      name: 'sheetSyncStatus',
      type: 'select',
      label: 'Sync foaie ops',
      // Written only by the afterChange hook via the DB adapter; the select
      // never offers itself as writable anywhere.
      options: SHEET_SYNC_STATUS_OPTIONS,
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: {
          Cell: '@/collections/Orders/components/SheetSyncStatusCell#SheetSyncStatusCell',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateOrder, syncOrderToSheet],
    beforeChange: [validateDeliveryDate],
  },
};
