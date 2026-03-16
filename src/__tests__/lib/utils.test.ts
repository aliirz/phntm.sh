import { describe, it, expect } from 'vitest';
import { generateId, formatFileSize, formatTimeRemaining } from '@/lib/utils';

describe('generateId', () => {
  it('produces a 10-character string by default', () => {
    expect(generateId()).toHaveLength(10);
  });

  it('respects custom length', () => {
    expect(generateId(20)).toHaveLength(20);
    expect(generateId(5)).toHaveLength(5);
  });

  it('only contains alphanumeric characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateId()).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });
});

describe('formatTimeRemaining', () => {
  it('returns "Expired" for past dates', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(formatTimeRemaining(past)).toBe('Expired');
  });

  it('returns minutes format for short durations', () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(formatTimeRemaining(soon)).toMatch(/\d+m remaining/);
  });

  it('returns hours + minutes format for medium durations', () => {
    const hours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatTimeRemaining(hours)).toMatch(/\d+h \d+m remaining/);
  });

  it('returns days + hours format for long durations', () => {
    const days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeRemaining(days)).toMatch(/\d+d \d+h remaining/);
  });
});
