'use client';

import { HolidayModal } from '@/components/HolidayModal';

export interface HolidayNoticeProps {
  active: boolean;
  title: string | null;
  message: string | null;
  imageUrl: string | null;
  lastDeliveryBefore: Date | null;
  firstDeliveryAfter: Date | null;
}

/**
 * Client boundary rendered in the root layout. Server resolves CMS fields and
 * notice state, this wrapper mounts the (sessionStorage-gated) modal on the
 * client.
 */
export function HolidayNotice(props: HolidayNoticeProps) {
  return <HolidayModal {...props} />;
}
