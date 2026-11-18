'use client';

/**
 * Official GLS Romania DPM widget (map.gls-romania.com) mounted in
 * dialog mode. Renders nothing visible; `registerOpen` hands back an
 * imperative opener for the host's own trigger button (issue #47).
 *
 * Widget facts (verified against gls-dpm-modern.js): the loader defines
 * TWO elements — `gls-dpm` (class field mode='widget', inline map) and
 * `gls-dpm-dialog` (class field mode='dialog'). `mode` is a constructor
 * class field, NOT an attribute or accessor, so poking `el.mode='dialog'
 * onto an unupgraded `gls-dpm` is clobbered at upgrade and the widget
 * renders as an invisible inline widget — dialog mode is only reachable
 * by mounting `gls-dpm-dialog`. Shared attributes: country/language/open
 * (open = boolean attribute, present = true); both emit `change`
 * (CustomEvent, detail = selected point) and `close`.
 */

import { useCallback, useRef } from 'react';

const WIDGET_SRC = 'https://map.gls-romania.com/widget/gls-dpm.js';

/** A GLS delivery point as chosen on the widget map. */
export interface GlsPoint {
  /** Matchcode — MyGLS PSDParameter.StringValue. */
  matchcode: string;
  /** Numeric DropOffPoint ID — MyGLS PSDParameter.IntegerValue. */
  goldId?: string;
  nume: string;
  adresa: string;
  tip: 'parcel-locker' | 'parcel-shop' | string;
}

interface GlsSelectionDetail {
  id?: unknown;
  matchcode?: unknown;
  goldId?: unknown;
  name?: unknown;
  type?: unknown;
  contact?: { address?: unknown; city?: unknown; postalCode?: unknown };
  location?: { city?: unknown };
}

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'gls-dpm-dialog': React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & {
          country?: string;
          language?: string;
          open?: string;
        };
      }
    }
  }
}

let widgetLoadPromise: Promise<void> | null = null;

function loadGlsWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (widgetLoadPromise) return widgetLoadPromise;
  widgetLoadPromise = new Promise((resolve, reject) => {
    if (window.customElements?.get('gls-dpm-dialog')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      widgetLoadPromise = null; // allow a later retry
      reject(new Error('gls-dpm.js failed to load'));
    };
    document.head.appendChild(script);
  });
  return widgetLoadPromise;
}

function parseSelection(detail: GlsSelectionDetail | undefined | null): GlsPoint | null {
  if (!detail || detail.name == null) return null;
  const contact = detail.contact ?? {};
  const adresa =
    [contact.address, contact.postalCode, contact.city, detail.location?.city]
      .filter((part) => typeof part === 'string' && part !== '')
      .join(', ') || '';
  const matchcode = detail.matchcode ?? detail.id;
  return {
    matchcode: matchcode != null ? String(matchcode) : '',
    goldId: detail.goldId != null ? String(detail.goldId) : undefined,
    nume: String(detail.name),
    adresa,
    tip: detail.type != null ? String(detail.type) : '',
  };
}

/** Element with our attached listeners (typed access to stored handlers). */
type GlsElement = HTMLElement & {
  _glsChange?: (event: Event) => void;
  _glsClose?: () => void;
};

export function GlsPointPicker({
  onSelect,
  onClose,
  registerOpen,
}: {
  /** Fires with the picked point when the customer confirms on the map. */
  onSelect: (point: GlsPoint) => void;
  /** Fires when the dialog closes without a new selection. */
  onClose?: () => void;
  /** Receives the imperative opener (safe to call before the script loads). */
  registerOpen: (open: () => void) => void;
}) {
  const elementRef = useRef<GlsElement | null>(null);
  // Latest handlers without re-binding element listeners on every render.
  const handlersRef = useRef({ onSelect, onClose, registerOpen });
  handlersRef.current = { onSelect, onClose, registerOpen };

  const setElement = useCallback((node: HTMLElement | null) => {
    const previous = elementRef.current;
    if (previous) {
      if (previous._glsChange) previous.removeEventListener('change', previous._glsChange);
      if (previous._glsClose) previous.removeEventListener('close', previous._glsClose);
    }
    const el = node as GlsElement | null;
    elementRef.current = el;
    if (!el) return;

    el._glsChange = (event: Event) => {
      const point = parseSelection((event as CustomEvent<GlsSelectionDetail>).detail);
      if (point) handlersRef.current.onSelect(point);
    };
    el._glsClose = () => {
      el.removeAttribute('open');
      handlersRef.current.onClose?.();
    };
    el.addEventListener('change', el._glsChange);
    el.addEventListener('close', el._glsClose);

    // Script loads lazily on first open — in-zone customers never pay for it.
    handlersRef.current.registerOpen(() => {
      loadGlsWidget()
        .then(() => el.setAttribute('open', ''))
        .catch(() => {
          // Widget unreachable: nothing opens; home delivery still works.
        });
    });
    // registerOpen identity is expected to be stable (host stores the opener).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <gls-dpm-dialog ref={setElement} country="RO" language="ro" />;
}

/** Feed entry shape (public ro.json delivery-point feed). */
interface FeedPoint {
  id?: unknown;
  goldId?: unknown;
}

let feedPromise: Promise<FeedPoint[] | null> | null = null;

/** Loads the public ro.json feed at most once per page session — every
 * checkout mount with a cached point used to re-download the full feed
 * (code review on #47). null = unreachable; callers fail open. A network
 * error clears the cache so a later mount can retry. */
function loadPointFeed(): Promise<FeedPoint[] | null> {
  if (!feedPromise) {
    feedPromise = fetch('https://map.gls-romania.com/data/deliveryPoints/ro.json', {
      signal: AbortSignal.timeout(10_000),
    })
      .then((res) => (res.ok ? (res.json() as Promise<FeedPoint[]>) : null))
      .catch(() => {
        feedPromise = null; // allow a later retry
        return null;
      });
  }
  return feedPromise;
}

/**
 * Checks a cached GLS point against the live public feed so a removed point
 * is never silently reused (see CONTEXT.md → Cached Checkout Profile).
 * Returns true when the point may stay: found, the feed was unreachable, or
 * the feed's shape cannot be trusted (fail-open — the widget is the source
 * of truth at pick time anyway).
 */
export async function glsPointStillExists(point: GlsPoint): Promise<boolean> {
  const feed = await loadPointFeed();
  if (!feed || !Array.isArray(feed) || feed.length === 0) return true;
  // Shape guard: entries without any identifier cannot disprove the cached
  // point — a feed-format change must not permanently reject valid points.
  if (!feed.some((entry) => entry.id != null || entry.goldId != null)) return true;
  return feed.some(
    (entry) =>
      (point.matchcode && String(entry.id ?? '') === point.matchcode) ||
      (point.goldId && String(entry.goldId ?? '') === point.goldId),
  );
}
