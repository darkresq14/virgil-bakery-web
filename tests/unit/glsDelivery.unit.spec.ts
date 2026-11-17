import { describe, expect, it } from 'vitest';

import {
  detectDeliveryZone,
  homeShippingCost,
  NATIONAL_SHIPPING_MIN,
  shippingCostFor,
} from '@/utilities/glsDelivery';

describe('detectDeliveryZone (issue #47)', () => {
  it('returns in for Sibiu + Sibiu', () => {
    expect(detectDeliveryZone('Sibiu', 'Sibiu')).toBe('in');
  });

  it('returns out for non-delivery zone', () => {
    expect(detectDeliveryZone('Cluj', 'Cluj-Napoca')).toBe('out');
  });

  it('returns out for Sibiu judet with non-delivery locality', () => {
    expect(detectDeliveryZone('Sibiu', 'Mediaș')).toBe('out');
  });

  it('returns unknown when only judet is provided', () => {
    expect(detectDeliveryZone('Sibiu', '')).toBe('unknown');
  });

  it('returns unknown when no address is provided', () => {
    expect(detectDeliveryZone('', '')).toBe('unknown');
  });

  it('returns in for all personal delivery localities', () => {
    const personalLocalities = ['Sibiu', 'Sura Mare', 'Sura Mica', 'Cisnadie', 'Cisnadioara'];
    for (const locality of personalLocalities) {
      expect(detectDeliveryZone('Sibiu', locality)).toBe('in');
    }
  });
});

describe('homeShippingCost (baker indicative tiers)', () => {
  it.each([
    [1, 26],
    [2, 26],
    [3, 30],
    [4, 39],
    [5, 39],
    [6, 53],
    [10, 53],
  ])('charges %i lei for %i items', (quantity, expected) => {
    expect(homeShippingCost(quantity)).toBe(expected);
  });

  it('is unavailable above 10 items', () => {
    expect(homeShippingCost(11)).toBeNull();
    expect(homeShippingCost(20)).toBeNull();
  });
});

describe('shippingCostFor', () => {
  it('is free inside the zone regardless of method state', () => {
    expect(shippingCostFor('personal', 'in', 5)).toBe(0);
  });

  it('flat 25 for GLS point delivery', () => {
    expect(shippingCostFor('gls-punct', 'out', 1)).toBe(25);
    expect(shippingCostFor('gls-punct', 'out', 10)).toBe(25);
  });

  it('tiered for GLS home delivery', () => {
    expect(shippingCostFor('gls-acasa', 'out', 3)).toBe(30);
  });

  it('null for GLS home delivery above 10 items', () => {
    expect(shippingCostFor('gls-acasa', 'out', 11)).toBeNull();
  });

  it('exposes the cheapest national rate for schema.org offers (GLS point flat fee)', () => {
    expect(NATIONAL_SHIPPING_MIN).toBe(25);
  });
});
