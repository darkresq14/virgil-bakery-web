import { describe, expect, it } from 'vitest';
import { holidayDates } from '@/utilities/holidayDates';

// 2026 weekday anchors (date-only semantics):
//   Mon 7/13, Tue 7/14, Wed 7/15, Thu 7/16, Fri 7/17, Sat 7/18, Sun 7/19,
//   Mon 7/20, Tue 7/21. Earlier rounds: Sun 7/5, Tue 7/7, Wed 7/8, Fri 7/10,
//   Sun 7/12. Delivery days are Tuesday and Friday.
//   Cutoffs: Tuesday -> preceding Sunday 17:00, Friday -> preceding Wednesday 17:00.

const at = (iso: string, hour = 12) => new Date(`${iso}T${String(hour).padStart(2, '0')}:00:00`);
/** Local calendar date as yyyy-mm-dd — comparisons are day-only by design. */
const ymd = (d: Date | null) =>
  d == null
    ? null
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('holidayDates', () => {
  it('is inactive with null dates when no holiday dates are set', () => {
    const result = holidayDates({
      holidayStartDate: null,
      holidayEndDate: null,
      referenceDate: at('2026-07-10'),
    });

    expect(result).toEqual({
      isNoticeActive: false,
      isHolidayActive: false,
      lastDeliveryBefore: null,
      firstDeliveryAfter: null,
    });
  });

  describe('lastDeliveryBefore', () => {
    it('is the last Tuesday or Friday strictly before the holiday start', () => {
      // Holiday Mon 7/13 -> Mon 7/20. Last delivery day before 7/13 is Fri 7/10.
      const result = holidayDates({
        holidayStartDate: at('2026-07-13'),
        holidayEndDate: at('2026-07-20'),
        referenceDate: at('2026-07-09'),
      });

      expect(ymd(result.lastDeliveryBefore)).toBe('2026-07-10');
    });

    it('excludes the start date when the holiday starts on a delivery day', () => {
      // Holiday starts Tue 7/14 (a delivery day). Last delivery before is Fri 7/10.
      const result = holidayDates({
        holidayStartDate: at('2026-07-14'),
        holidayEndDate: at('2026-07-20'),
        referenceDate: at('2026-07-09'),
      });

      expect(ymd(result.lastDeliveryBefore)).toBe('2026-07-10');
    });
  });

  describe('firstDeliveryAfter', () => {
    it('is the first Tuesday or Friday on or after the day after the holiday end', () => {
      // Holiday Mon 7/13 -> Mon 7/20. Day after end is Tue 7/21 (delivery day).
      const result = holidayDates({
        holidayStartDate: at('2026-07-13'),
        holidayEndDate: at('2026-07-20'),
        referenceDate: at('2026-07-09'),
      });

      expect(ymd(result.firstDeliveryAfter)).toBe('2026-07-21');
    });

    it('skips forward to the next delivery day when the day after end is not one', () => {
      // Holiday ends Tue 7/14 (delivery day). Day after is Wed 7/15 -> next is Fri 7/17.
      const result = holidayDates({
        holidayStartDate: at('2026-07-14'),
        holidayEndDate: at('2026-07-14'),
        referenceDate: at('2026-07-09'),
      });

      expect(ymd(result.firstDeliveryAfter)).toBe('2026-07-17');
    });
  });

  describe('isNoticeActive (preview + active)', () => {
    // Holiday Mon 7/13 -> Mon 7/20. Overlapping delivery days: Tue 7/14, Fri 7/17.
    // lastDeliveryBefore = Fri 7/10. firstDeliveryAfter = Tue 7/21.
    const holiday = {
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    };

    it('is active in preview — before the holiday start, once a delivery day overlaps', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-05') });
      expect(result.isNoticeActive).toBe(true);
    });

    it('is active the day before the holiday starts', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-12') });
      expect(result.isNoticeActive).toBe(true);
    });

    it('is active on the holiday start date', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-13') });
      expect(result.isNoticeActive).toBe(true);
    });

    it('stays active through the end date (inclusive)', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-20') });
      expect(result.isNoticeActive).toBe(true);
    });

    it('deactivates the day after the holiday end date', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-21') });
      expect(result.isNoticeActive).toBe(false);
    });

    it('is inactive for a short holiday that overlaps no delivery day', () => {
      // Holiday Wed 7/15 -> Thu 7/16: no Tue/Fri inside, nothing to disrupt.
      const result = holidayDates({
        holidayStartDate: at('2026-07-15'),
        holidayEndDate: at('2026-07-16'),
        referenceDate: at('2026-07-15'),
      });
      expect(result.isNoticeActive).toBe(false);
    });
  });

  describe('isHolidayActive (active phase only)', () => {
    // Holiday Mon 7/13 -> Mon 7/20.
    // lastDeliveryBefore = Fri 7/10 -> its ordering cutoff = Wed 7/8 17:00.
    // The modal fires once no pre-holiday slot remains orderable.
    const holiday = {
      holidayStartDate: at('2026-07-13'),
      holidayEndDate: at('2026-07-20'),
    };

    it('is false before the last pre-holiday delivery cutoff passes', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-08', 16) });
      expect(result.isHolidayActive).toBe(false);
    });

    it('is true at the last pre-holiday delivery cutoff', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-08', 17) });
      expect(result.isHolidayActive).toBe(true);
    });

    it('is true in the ordering gap — after cutoff, before calendar holiday start', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-12') });
      expect(result.isHolidayActive).toBe(true);
    });

    it('is true mid-holiday', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-16') });
      expect(result.isHolidayActive).toBe(true);
    });

    it('is true on the end date (inclusive)', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-20') });
      expect(result.isHolidayActive).toBe(true);
    });

    it('is false the day after the holiday ends', () => {
      const result = holidayDates({ ...holiday, referenceDate: at('2026-07-21') });
      expect(result.isHolidayActive).toBe(false);
    });

    it('is false for a short holiday that overlaps no delivery day', () => {
      const result = holidayDates({
        holidayStartDate: at('2026-07-15'),
        holidayEndDate: at('2026-07-16'),
        referenceDate: at('2026-07-15'),
      });
      expect(result.isHolidayActive).toBe(false);
    });
  });
});
