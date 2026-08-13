import type { StaticImageData } from 'next/image';
import type { ElementType, Ref } from 'react';

import type { Media as MediaType } from '@/payload-types';

/**
 * Display context for an image. Determines which Payload upload size is used as the
 * optimizer's *source cap* (see ImageMedia). Decoupled from storage internals so
 * callers describe the slot, not the Payload size.
 */
export type ImageSlot = 'hero' | 'detail' | 'card' | 'thumbnail';

export interface Props {
  alt?: string;
  className?: string;
  fill?: boolean; // for NextImage only
  htmlElement?: ElementType | null;
  pictureClassName?: string;
  imgClassName?: string;
  onClick?: () => void;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager'; // for NextImage only
  priority?: boolean; // for NextImage only
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>;
  resource?: MediaType | string | number | null; // for Payload media
  size?: string; // for NextImage only
  /** Display context. Selects the Payload source size fed to the optimizer. Defaults to 'detail'. */
  slot?: ImageSlot;
  src?: StaticImageData; // for static media
  /**
   * Skip the Vercel image optimizer — serve the source as-is. For tiny assets
   * (logos/icons) whose source is already small/optimal, where optimization only
   * multiplies transform keys without benefit (see #32).
   */
  unoptimized?: boolean;
  videoClassName?: string;
}
