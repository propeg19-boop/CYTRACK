import { describe, it, expect } from 'vitest';
import {
  calculateCycleStats,
  parseDateString,
  CycleRecord,
} from './cycleStats';

describe('cycleStats Deterministic Cycle Calculations', () => {
  it('should handle zero cycles logged (clean fallback)', () => {
    const stats = calculateCycleStats([], parseDateString('2026-10-01'), 28, 5);
    expect(stats.currentCycleDay).toBeNull();
    expect(stats.isPeriodActive).toBe(false);
    expect(stats.hasSufficientData).toBe(false);
    expect(stats.totalCyclesLogged).toBe(0);
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.averagePeriodDuration).toBe(5);
    expect(stats.estimatedNextPeriodStart).toBeNull();
  });

  it('should handle one logged period (current cycle day calculated, baseline fallback used)', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-09-20', end_date: '2026-09-24' },
    ];
    const stats = calculateCycleStats(cycles, parseDateString('2026-10-01'), 28, 5);

    // From 2026-09-20 to 2026-10-01 is 11 days difference -> Day 12
    expect(stats.currentCycleDay).toBe(12);
    expect(stats.isPeriodActive).toBe(false);
    expect(stats.hasSufficientData).toBe(false); // only 1 start, no interval yet
    expect(stats.totalCyclesLogged).toBe(1);
    expect(stats.averageCycleLength).toBe(28); // fallback
    expect(stats.averagePeriodDuration).toBe(5); // 20-24 inclusive is 5 days

    // Predicted next start = 2026-09-20 + 28 days = 2026-10-18
    expect(stats.estimatedNextPeriodStart).toBe('2026-10-18');
    expect(stats.estimatedPeriodWindow).toEqual({
      start: '2026-10-16',
      end: '2026-10-20',
    });
  });

  it('should compute exact cycle length with two period starts', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-08-15', end_date: '2026-08-19' },
      { start_date: '2026-09-14', end_date: '2026-09-18' },
    ];
    // Gap: Aug 15 to Sep 14 = 30 days
    const stats = calculateCycleStats(cycles, parseDateString('2026-09-20'));

    expect(stats.hasSufficientData).toBe(true);
    expect(stats.cycleLengthHistory).toEqual([30]);
    expect(stats.averageCycleLength).toBe(30);
    // Next start: Sep 14 + 30 days = Oct 14
    expect(stats.estimatedNextPeriodStart).toBe('2026-10-14');
  });

  it('should average multiple historical intervals correctly', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-06-01', end_date: '2026-06-05' }, // interval 1: 28 days
      { start_date: '2026-06-29', end_date: '2026-07-03' }, // interval 2: 30 days
      { start_date: '2026-07-29', end_date: '2026-08-02' }, // interval 3: 29 days
      { start_date: '2026-08-27', end_date: '2026-08-31' },
    ];
    // Intervals: 28, 30, 29 -> Average = 29
    const stats = calculateCycleStats(cycles, parseDateString('2026-09-05'));
    expect(stats.cycleLengthHistory).toEqual([28, 30, 29]);
    expect(stats.averageCycleLength).toBe(29);
    // Next start: 2026-08-27 + 29 days = 2026-09-25
    expect(stats.estimatedNextPeriodStart).toBe('2026-09-25');
  });

  it('should detect open / ongoing period bleed correctly', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-10-01', end_date: null }, // Period started today
    ];
    const stats = calculateCycleStats(cycles, parseDateString('2026-10-01'));
    expect(stats.isPeriodActive).toBe(true);
    expect(stats.activePeriodDay).toBe(1);
    expect(stats.currentCycleDay).toBe(1);
  });

  it('should handle leap years and month boundaries accurately', () => {
    // Leap year 2024 (Feb has 29 days)
    const cycles: CycleRecord[] = [
      { start_date: '2024-02-10', end_date: '2024-02-15' },
      { start_date: '2024-03-09', end_date: '2024-03-14' },
    ];
    // Days in Feb 2024 = 29. Feb 10 to Mar 9 = 19 + 9 = 28 days
    const stats = calculateCycleStats(cycles, parseDateString('2024-03-15'));
    expect(stats.averageCycleLength).toBe(28);
    // Next: Mar 9 + 28 days = Apr 6
    expect(stats.estimatedNextPeriodStart).toBe('2024-04-06');
  });

  it('should handle year rollover boundaries seamlessly', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2025-12-15', end_date: '2025-12-20' },
      { start_date: '2026-01-14', end_date: '2026-01-19' },
    ];
    // Dec 15 to Jan 14 = 16 + 14 = 30 days
    const stats = calculateCycleStats(cycles, parseDateString('2026-01-20'));
    expect(stats.averageCycleLength).toBe(30);
    // Next start: Jan 14 + 30 days = Feb 13
    expect(stats.estimatedNextPeriodStart).toBe('2026-02-13');
  });
});
