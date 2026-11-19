import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type GlsPoint, GlsPointPicker } from '@/components/GlsPointPicker';

/**
 * Reproduces the gls-romania widget's custom element semantics (verified
 * against map.gls-romania.com/widget/gls-dpm-modern.js):
 *
 * - `gls-dpm` and `gls-dpm-dialog` are two DIFFERENT classes; mode is a
 *   class FIELD initialised in the constructor ('widget' resp. 'dialog'),
 *   not an attribute or accessor.
 * - `open` is an observed boolean attribute (present = true).
 *
 * Consequence the picker must respect: a `mode` property poked onto an
 * unupgraded `<gls-dpm>` is clobbered by the class field when the script
 * upgrades the element — the widget silently renders as an invisible inline
 * widget instead of a dialog (bug: "Alege punctul GLS pe hartă does
 * nothing"). Dialog mode is only reachable by mounting `gls-dpm-dialog`.
 */

class StubDpmBase extends HTMLElement {
  static observedAttributes = ['country', 'language', 'open'];

  /** Mirrors observedAttributesState.open: attribute presence. */
  isOpen = false;
  /** Set by syncRendered — true only when the dialog UI would show. */
  dialogRendered = false;
  /** Only declared (no class field!) — subclasses define the real class
   * fields, which must keep clobbering pre-upgrade property pokes. */
  declare mode: string;

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name !== 'open') return;
    this.isOpen = value !== null;
    this.syncRendered();
  }

  connectedCallback() {
    this.syncRendered();
  }

  /** shouldRenderComponent(): widget mode always "renders" inline (into a
   * 0×0 host — invisible); dialog mode renders only while open. */
  syncRendered() {
    this.dialogRendered = this.mode === 'dialog' && this.isOpen;
  }
}

class StubGlsDpm extends StubDpmBase {
  // Class field, like the real widget — clobbers pre-upgrade property pokes.
  mode = 'widget' as const;
}
class StubGlsDpmDialog extends StubDpmBase {
  mode = 'dialog' as const;
}

/** Simulates the async gls-dpm.js load finishing: both elements upgrade,
 * existing pre-upgrade attribute/property values get processed. Names
 * persist in the shared registry for the whole file, so guard the defines. */
function simulateWidgetScriptLoaded() {
  if (!window.customElements.get('gls-dpm')) {
    window.customElements.define('gls-dpm', StubGlsDpm);
  }
  if (!window.customElements.get('gls-dpm-dialog')) {
    window.customElements.define('gls-dpm-dialog', StubGlsDpmDialog);
  }
}

afterEach(() => {
  cleanup();
});

describe('GlsPointPicker', () => {
  it('opens as a dialog (gls-dpm-dialog) when the trigger fires, even when the widget script upgrades the element after mount', async () => {
    let open: (() => void) | undefined;
    render(<GlsPointPicker onSelect={() => {}} registerOpen={(fn) => (open = fn)} />);
    expect(open).toBeTypeOf('function');

    // The script loads lazily on first open — element mounts unupgraded.
    simulateWidgetScriptLoaded();

    open?.();
    // loadGlsWidget resolves via a microtask even when already defined.
    await Promise.resolve();

    const dialog = document.querySelector<StubGlsDpmDialog>('gls-dpm-dialog');
    expect(dialog).not.toBeNull();
    expect(dialog?.mode).toBe('dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(dialog?.dialogRendered).toBe(true);
  });

  it('parses the widget change event into a GlsPoint', async () => {
    const onSelect = vi.fn<(point: GlsPoint) => void>();
    let open: (() => void) | undefined;
    render(<GlsPointPicker onSelect={onSelect} registerOpen={(fn) => (open = fn)} />);
    simulateWidgetScriptLoaded();
    open?.();
    await Promise.resolve();

    const dialog = document.querySelector('gls-dpm-dialog');
    expect(dialog).not.toBeNull();
    dialog?.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          id: 'RO12345',
          name: 'Easybox Brașov',
          type: 'parcel-locker',
          contact: { address: 'Str. Lungă 1', city: 'Brașov', postalCode: '500052' },
        },
      }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      matchcode: 'RO12345',
      goldId: undefined,
      nume: 'Easybox Brașov',
      adresa: 'Str. Lungă 1, 500052, Brașov',
      tip: 'parcel-locker',
    });
  });

  it('drops the open attribute when the dialog closes', async () => {
    let open: (() => void) | undefined;
    render(<GlsPointPicker onSelect={() => {}} registerOpen={(fn) => (open = fn)} />);
    simulateWidgetScriptLoaded();
    open?.();
    await Promise.resolve();

    const dialog = document.querySelector<StubGlsDpmDialog>('gls-dpm-dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);

    dialog?.dispatchEvent(new CustomEvent('close'));
    expect(dialog?.hasAttribute('open')).toBe(false);
  });
});
