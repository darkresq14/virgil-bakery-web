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

describe('homeShippingCost (baker-confirmed weight tiers, #59)', () => {
  it.each([
    [500, 26],
    [2000, 26],
    [2001, 33],
    [5000, 33],
    [5001, 43],
    [10000, 43],
  ])('charges %i lei for %ig (bounds inclusive)', (grams, expected) => {
    expect(homeShippingCost(grams)).toBe(expected);
  });

  it('is unavailable above 10 kg', () => {
    expect(homeShippingCost(10001)).toBeNull();
    expect(homeShippingCost(24000)).toBeNull();
  });
});

describe('shippingCostFor', () => {
  it('is free inside the zone regardless of method state', () => {
    expect(shippingCostFor('personal', 'in', 5)).toBe(0);
  });

  it('flat 25 for GLS point delivery at any weight', () => {
    expect(shippingCostFor('gls-punct', 'out', 300)).toBe(25);
    expect(shippingCostFor('gls-punct', 'out', 12000)).toBe(25);
  });

  it('tiered by weight for GLS home delivery', () => {
    expect(shippingCostFor('gls-acasa', 'out', 2400)).toBe(33);
  });

  it('null for GLS home delivery above 10 kg', () => {
    expect(shippingCostFor('gls-acasa', 'out', 10001)).toBeNull();
  });

  it('exposes the cheapest national rate for schema.org offers (GLS point flat fee)', () => {
    expect(NATIONAL_SHIPPING_MIN).toBe(25);
  });
});
