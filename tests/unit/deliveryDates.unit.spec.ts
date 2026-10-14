import { describe, expect, it } from 'vitest';
import { getDeliveryDates, isInHoliday } from '@/utilities/deliveryDates';

// 2026 weekday anchors (date-only semantics):
//   Sun 7/5, Mon 7/6, Tue 7/7, Wed 7/8, Thu 7/9, Fri 7/10, Sat 7/11,
//   Sun 7/12, Mon 7/13, Tue 7/14, Wed 7/15, Thu 7/16, Fri 7/17, Sat 7/18,
//   Sun 7/19, Mon 7/20, Tue 7/21, Wed 7/22, Thu 7/23, Fri 7/24.
// Delivery days: Tuesday (2) and Friday (5).
// Cutoffs: Tuesday -> preceding Sunday 17:00, Friday -> preceding Wednesday 17:00.

const at = (iso: string, hour = 12) => new Date(`${iso}T${String(hour).padStart(2, '0')}:00:00`);

describe('getDeliveryDates', () => {
  it('returns options carrying an isHoliday flag defaulting to false when called with no args', () => {
    const dates = getDeliveryDates();

    expect(dates.length).toBeGreaterThan(0);
    for (const option of dates) {
      expect(option).toHaveProperty('isHoliday', false);
      expect(option).toHaveProperty('isSelectable');
      expect(typeof option.label).toBe('string');
      expect(option.date).toBeInstanceOf(Date);
    }
  });

  it('marks the near Friday as past-cutoff and the near Tuesday as selectable when referenced after the Friday cutoff', () => {
    // referenceDate Thu 7/9 12:00.
    // Fri 7/10 cutoff (Wed 7/8 17:00) already passed -> non-selectable, plus next Fri 7/17 selectable.
    // Tue 7/14 cutoff (Sun 7/12 17:00) not yet reached -> selectable.
    const dates = getDeliveryDates({ referenceDate: at('2026-07-09') });

    expect(dates.map((d) => d.label)).toEqual([
      'Vineri, 10 Iulie',
      'Marți, 14 Iulie',
      'Vineri, 17 Iulie',
    ]);
    const byLabel = new Map(dates.map((d) => [d.label, d] as const));
    expect(byLabel.get('Vineri, 10 Iulie')?.isSelectable).toBe(false); // past cutoff
    expect(byLabel.get('Marți, 14 Iulie')?.isSelectable).toBe(true);
    expect(byLabel.get('Vineri, 17 Iulie')?.isSelectable).toBe(true); // next week
  });

  it('labels past-cutoff dates with blockedReason "cutoff"', () => {
    // referenceDate Thu 7/9: Fri 7/10 is past its cutoff, Tue 7/14 is not.
    const dates = getDeliveryDates({ referenceDate: at('2026-07-09') });
    const byLabel = new Map(dates.map((d) => [d.label, d] as const));

    expect(byLabel.get('Vineri, 10 Iulie')?.blockedReason).toBe('cutoff');
    expect(byLabel.get('Marți, 14 Iulie')?.blockedReason).toBeNull();
  });

  it('labels non-allowed weekdays with blockedReason "availability", even past cutoff', () => {
    // Friday-only cart (allowedDays [5]), referenceDate Thu 7/9.
    // Tue 7/14 is before its cutoff but Tuesday is not allowed -> availability.
    // Fri 7/10 is past cutoff AND allowed -> cutoff.
    const dates = getDeliveryDates({ referenceDate: at('2026-07-09'), allowedDays: [5] });
    const byLabel = new Map(dates.map((d) => [d.label, d] as const));

    expect(byLabel.get('Marți, 14 Iulie')?.isSelectable).toBe(false);
    expect(byLabel.get('Marți, 14 Iulie')?.blockedReason).toBe('availability');
    expect(byLabel.get('Vineri, 10 Iulie')?.blockedReason).toBe('cutoff');
    expect(byLabel.get('Vineri, 17 Iulie')?.blockedReason).toBeNull();
  });

  it('marks a delivery date inside the holiday range as isHoliday true and non-selectable', () => {
    // Holiday Mon 7/13 -> Mon 7/20. referenceDate Thu 7/9.
    // Tue 7/14 sits inside the holiday and would normally be selectable (cutoff Sun 7/12 17:00).
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    });

    const tue14 = dates.find((d) => d.label === 'Marți, 14 Iulie');
    expect(tue14?.isHoliday).toBe(true);
    expect(tue14?.isSelectable).toBe(false);
  });

  it('leaves a past-cutoff date outside the holiday range untouched (no holiday flag, still non-selectable)', () => {
    // Holiday Mon 7/13 -> Mon 7/20. referenceDate Thu 7/9.
    // Fri 7/10 is before the holiday and past its cutoff -> same as the no-holiday behavior.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    });

    const fri10 = dates.find((d) => d.label === 'Vineri, 10 Iulie');
    expect(fri10?.isHoliday).toBe(false);
    expect(fri10?.isSelectable).toBe(false);
  });

  it('flags a date that is both past cutoff and inside the holiday as isHoliday true (holiday takes visual precedence)', () => {
    // Holiday Mon 7/13 -> Mon 7/20. referenceDate Mon 7/13.
    // Tue 7/14 cutoff (Sun 7/12 17:00) has passed AND 7/14 is inside the holiday.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-13'),
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    });

    const tue14 = dates.find((d) => d.label === 'Marți, 14 Iulie');
    expect(tue14?.isHoliday).toBe(true);
    expect(tue14?.isSelectable).toBe(false);
  });

  it('extends forward past the holiday to guarantee at least two selectable dates', () => {
    // Holiday Mon 7/13 -> Mon 7/20 eats Tue 7/14 and Fri 7/17. referenceDate Thu 7/9.
    // Base window yields zero selectable dates, so the function must reach past the holiday.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    });

    expect(dates.filter((d) => d.isSelectable).length).toBeGreaterThanOrEqual(2);

    const tue21 = dates.find((d) => d.label === 'Marți, 21 Iulie');
    const fri24 = dates.find((d) => d.label === 'Vineri, 24 Iulie');
    expect(tue21?.isSelectable).toBe(true);
    expect(tue21?.isHoliday).toBe(false);
    expect(fri24?.isSelectable).toBe(true);
    expect(fri24?.isHoliday).toBe(false);
  });

  it('behaves identically whether holiday args are omitted or passed as null (backward compatible)', () => {
    const omitted = getDeliveryDates({ referenceDate: at('2026-07-09') });
    const nulled = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      holidayStartDate: null,
      holidayEndDate: null,
    });

    expect(nulled.map((d) => d.label)).toEqual(omitted.map((d) => d.label));
    for (const option of nulled) {
      expect(option.isHoliday).toBe(false);
    }
  });

  it('restricts selectable dates to concrete allowedDates (one-off cart), graying the others as "availability"', () => {
    // Cart with a one-off product for Fri 7/17 + a regular product (allowedDays [5]).
    // referenceDate Thu 7/9: Fri 7/10 is past cutoff AND not the allowed date
    // -> "availability" keeps priority, Tue 7/14 is a non-allowed weekday,
    // Fri 7/17 is the only selectable option.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      allowedDays: [5],
      allowedDates: [at('2026-07-17')],
    });
    const byLabel = new Map(dates.map((d) => [d.label, d] as const));

    expect(byLabel.get('Vineri, 10 Iulie')?.isSelectable).toBe(false);
    expect(byLabel.get('Vineri, 10 Iulie')?.blockedReason).toBe('availability');
    expect(byLabel.get('Marți, 14 Iulie')?.isSelectable).toBe(false);
    expect(byLabel.get('Vineri, 17 Iulie')?.isSelectable).toBe(true);
    expect(byLabel.get('Vineri, 17 Iulie')?.blockedReason).toBeNull();
    // Never extends beyond the latest allowed date chasing more selectable options.
    expect(dates.filter((d) => d.isSelectable)).toHaveLength(1);
  });

  it('reaches forward to the allowed date when the near occurrences are not allowed', () => {
    // referenceDate Wed 7/8 10:00 (before the 17:00 cutoff): Fri 7/10 would
    // normally be selectable, but only Fri 7/17 is allowed for this cart.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-08', 10),
      allowedDays: [5],
      allowedDates: [at('2026-07-17')],
    });
    const byLabel = new Map(dates.map((d) => [d.label, d] as const));

    expect(byLabel.get('Vineri, 10 Iulie')?.isSelectable).toBe(false);
    expect(byLabel.get('Vineri, 10 Iulie')?.blockedReason).toBe('availability');
    expect(byLabel.get('Vineri, 17 Iulie')?.isSelectable).toBe(true);
  });

  it('treats an empty allowedDates array as a full conflict: everything unselectable, no runaway extension', () => {
    // Two one-off products with different dates -> no valid delivery date.
    const dates = getDeliveryDates({
      referenceDate: at('2026-07-09'),
      allowedDays: [2, 5],
      allowedDates: [],
    });

    expect(dates.length).toBeGreaterThan(0);
    expect(dates.every((d) => !d.isSelectable)).toBe(true);
    for (const option of dates) {
      expect(option.blockedReason).toBe('availability');
    }
  });
});

describe('isInHoliday', () => {
  const start = at('2026-07-06'); // Monday
  const end = at('2026-07-12'); // Sunday

  it('matches days inside the range (inclusive on both ends)', () => {
    expect(isInHoliday(at('2026-07-06'), start, end)).toBe(true);
    expect(isInHoliday(at('2026-07-10'), start, end)).toBe(true);
    expect(isInHoliday(at('2026-07-12'), start, end)).toBe(true);
  });

  it('rejects days outside the range', () => {
    expect(isInHoliday(at('2026-07-05'), start, end)).toBe(false);
    expect(isInHoliday(at('2026-07-13'), start, end)).toBe(false);
  });

  it('accepts ISO strings and treats null as no holiday', () => {
    expect(isInHoliday(at('2026-07-08'), '2026-07-06T00:00:00.000Z', '2026-07-12')).toBe(true);
    expect(isInHoliday(at('2026-07-08'), null, null)).toBe(false);
    expect(isInHoliday(at('2026-07-08'), undefined, undefined)).toBe(false);
  });
});
