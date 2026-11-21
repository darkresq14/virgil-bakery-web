import { describe, expect, it } from 'vitest';
import { WHATSAPP_NUMBER_FALLBACK, whatsappLink } from '@/utilities/whatsapp';

describe('whatsappLink', () => {
  it('strips formatting from a valid number', () => {
    expect(whatsappLink('+40 746 245 391')).toBe('https://wa.me/40746245391');
  });

  it('falls back to the default number when none is configured', () => {
    expect(WHATSAPP_NUMBER_FALLBACK).toBe('+40746245391');
    expect(whatsappLink()).toBe('https://wa.me/40746245391');
    expect(whatsappLink(null)).toBe('https://wa.me/40746245391');
    expect(whatsappLink('')).toBe('https://wa.me/40746245391');
  });

  it('falls back when a configured number strips to no digits — never a bare wa.me root', () => {
    expect(whatsappLink('n/a')).toBe('https://wa.me/40746245391');
    expect(whatsappLink('---')).toBe('https://wa.me/40746245391');
  });
});
