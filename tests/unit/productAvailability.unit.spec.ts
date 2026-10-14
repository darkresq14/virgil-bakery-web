import { describe, expect, it } from 'vitest';
import {
  isEffectivelyPurchaseable,
  isOneOffPurchaseable,
  isSameRoDay,
  oneOffDateLabel,
  parseOneOffDate,
} from '@/utilities/productAvailability';

// 2026 weekday anchors (see deliveryDates.unit.spec.ts):
//   Wed 7/8, Thu 7/9, Fri 7/10, Sun 7/12, Tue 7/14, Wed 7/15, Fri 7/17.
// Delivery days: Tuesday (2) and Friday (5).
// Friday 7/17 cutoff: Wednesday 7/15 17:00. One-off activation lead: 7 days
// -> purchase window for Fri 7/17 opens Wed 7/8 17:00 and closes Wed 7/15 17:00.

const at = (iso: string, hour = 12, minute = 0) =>
  new Date(`${iso}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

const friday717 = parseOneOffDate('2026-07-17') as Date;

describe('parseOneOffDate', () => {
  it('normalizes any instant to its Europe/Bucharest calendar day at UTC midnight', () => {
    // 2026-07-17T21:00Z == 2026-07-18 00:00 Europe/Bucharest (UTC+3, summer)
    const lateNight = parseOneOffDate('2026-07-17T21:00:00.000Z');
    expect(lateNight?.toISOString()).toBe('2026-07-18T00:00:00.000Z');
    expect(lateNight?.getUTCDay()).toBe(6); // Saturday
  });

  it('returns null for empty, invalid, or missing values', () => {
    expect(parseOneOffDate(null)).toBeNull();
    expect(parseOneOffDate(undefined)).toBeNull();
    expect(parseOneOffDate('')).toBeNull();
    expect(parseOneOffDate('not-a-date')).toBeNull();
  });
});

describe('isOneOffPurchaseable', () => {
  it('activates exactly at the previous cycle cutoff (Wed 17:00, nine days before a Friday)', () => {
    expect(isOneOffPurchaseable(friday717, at('2026-07-08', 16, 59))).toBe(false);
    expect(isOneOffPurchaseable(friday717, at('2026-07-08', 17, 0))).toBe(true);
  });

  it('keeps the activation at 17:00 wall-clock across the autumn DST switch (no absolute-ms drift)', () => {
    // One-off Fri 2026-10-30: cutoff Wed 10-28 17:00 EET (UTC+2). Previous
    // cycle cutoff: Wed 10-21 17:00 EEST (UTC+3). Absolute-ms subtraction
    // (168h) would land at 18:00 wall-clock and open the window 1h late.
    const friday1030 = parseOneOffDate('2026-10-30') as Date;
    expect(isOneOffPurchaseable(friday1030, new Date('2026-10-21T13:59:00Z'))).toBe(false);
    expect(isOneOffPurchaseable(friday1030, new Date('2026-10-21T14:00:00Z'))).toBe(true);
  });

  it('keeps the activation at 17:00 wall-clock across the spring DST switch', () => {
    // One-off Fri 2027-04-02: cutoff Wed 03-31 17:00 EEST (UTC+3). Previous
    // cycle cutoff: Wed 03-24 17:00 EET (UTC+2). Absolute-ms subtraction
    // would land at 16:00 wall-clock and open the window 1h early.
    const friday0402 = parseOneOffDate('2027-04-02') as Date;
    expect(isOneOffPurchaseable(friday0402, new Date('2027-03-24T14:59:00Z'))).toBe(false);
    expect(isOneOffPurchaseable(friday0402, new Date('2027-03-24T15:00:00Z'))).toBe(true);
  });

  it('deactivates at the date cutoff (Wed 17:00, two days before)', () => {
    expect(isOneOffPurchaseable(friday717, at('2026-07-15', 16, 59))).toBe(true);
    expect(isOneOffPurchaseable(friday717, at('2026-07-15', 17, 0))).toBe(false);
    expect(isOneOffPurchaseable(friday717, at('2026-07-17', 12))).toBe(false);
  });

  it('is purchaseable mid-window', () => {
    expect(isOneOffPurchaseable(friday717, at('2026-07-09'))).toBe(true);
    expect(isOneOffPurchaseable(friday717, at('2026-07-14'))).toBe(true);
  });
});

describe('isEffectivelyPurchaseable', () => {
  it('one-off overrides the available checkbox in both directions', () => {
    // Checkbox off, window open -> still purchaseable (date wins).
    expect(
      isEffectivelyPurchaseable(
        { available: false, availableOnDate: '2026-07-17' },
        at('2026-07-09'),
      ),
    ).toBe(true);
    // Checkbox on, window closed -> not purchaseable (date wins).
    expect(
      isEffectivelyPurchaseable(
        { available: true, availableOnDate: '2026-07-17' },
        at('2026-07-20'),
      ),
    ).toBe(false);
  });

  it('without a date, mirrors the available checkbox', () => {
    expect(isEffectivelyPurchaseable({ available: true }, at('2026-07-09'))).toBe(true);
    expect(isEffectivelyPurchaseable({ available: false }, at('2026-07-09'))).toBe(false);
    expect(isEffectivelyPurchaseable({}, at('2026-07-09'))).toBe(true); // default true
  });
});

describe('oneOffDateLabel', () => {
  it('renders "Doar <weekday>, <day> <month>" in Romanian', () => {
    expect(oneOffDateLabel(friday717)).toBe('Doar vineri, 17 iulie');
  });
});

describe('isSameRoDay', () => {
  it('compares Europe/Bucharest calendar days, not instants', () => {
    // Same RO day despite different instants/times.
    expect(isSameRoDay(at('2026-07-17', 1), at('2026-07-17', 23, 30))).toBe(true);
    expect(isSameRoDay(at('2026-07-17'), at('2026-07-18'))).toBe(false);
    // 22:00Z is already the next RO day in summer (UTC+3).
    expect(isSameRoDay(new Date('2026-07-17T22:00:00Z'), at('2026-07-17', 12))).toBe(false);
  });
});
