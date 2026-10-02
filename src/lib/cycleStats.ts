/**
 * CYTRACK — Pure Deterministic Cycle Engine (cycleStats.ts)
 * 
 * Rules:
 * 1. ZERO React dependencies, ZERO Supabase dependencies.
 * 2. Deterministic mathematical predictions based on user's actual historical cycle starts.
 * 3. Never claim medical certainty; always return estimated ranges and confidence levels.
 */

export interface CycleRecord {
  id?: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD or null if currently active
  notes?: string | null;
}

export interface CycleStatsResult {
  currentCycleDay: number | null;
  isPeriodActive: boolean;
  activePeriodDay: number | null;
  averageCycleLength: number;
  averagePeriodDuration: number;
  hasSufficientData: boolean;
  totalCyclesLogged: number;
  estimatedNextPeriodStart: string | null; // YYYY-MM-DD
  estimatedPeriodWindow: {
    start: string; // YYYY-MM-DD (typically -2 days)
    end: string;   // YYYY-MM-DD (typically +2 days)
  } | null;
  estimatedOvulationDate: string | null; // YYYY-MM-DD
  cycleLengthHistory: number[];
  disclaimer: string;
}

/**
 * Parses YYYY-MM-DD into a midday Date object to ensure timezone and DST safety.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Normalizes any Date to local midday to eliminate any UTC/DST edge cases.
 */
export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

/**
 * Formats a Date object into YYYY-MM-DD.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates day difference between two Date objects (d2 - d1 in calendar days).
 */
export function diffDays(d1: Date, d2: Date): number {
  const n1 = normalizeDate(d1).getTime();
  const n2 = normalizeDate(d2).getTime();
  return Math.round((n2 - n1) / (1000 * 60 * 60 * 24));
}

/**
 * Adds or subtracts days from a given date string and returns a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

/**
 * Calculates the cycle stats and deterministic predictions given a list of cycles.
 */
export function calculateCycleStats(
  cycles: CycleRecord[],
  referenceDate: Date = new Date(),
  fallbackCycleLength: number = 28,
  fallbackPeriodDuration: number = 5
): CycleStatsResult {
  const disclaimer = 'Estimations are based on statistical averages of your logged data and are not medical or contraceptive guarantees.';

  if (!cycles || cycles.length === 0) {
    return {
      currentCycleDay: null,
      isPeriodActive: false,
      activePeriodDay: null,
      averageCycleLength: fallbackCycleLength,
      averagePeriodDuration: fallbackPeriodDuration,
      hasSufficientData: false,
      totalCyclesLogged: 0,
      estimatedNextPeriodStart: null,
      estimatedPeriodWindow: null,
      estimatedOvulationDate: null,
      cycleLengthHistory: [],
      disclaimer,
    };
  }

  // Sort cycles chronologically ascending by start_date
  const sortedCycles = [...cycles].sort((a, b) => {
    return parseDateString(a.start_date).getTime() - parseDateString(b.start_date).getTime();
  });

  const latestCycle = sortedCycles[sortedCycles.length - 1];
  const latestStart = parseDateString(latestCycle.start_date);
  const refDateNoTime = normalizeDate(referenceDate);

  // 1. Calculate Current Cycle Day
  const daysSinceLatestStart = diffDays(latestStart, refDateNoTime);
  const currentCycleDay = daysSinceLatestStart >= 0 ? daysSinceLatestStart + 1 : 1;

  // 2. Check if period is currently active
  let isPeriodActive = false;
  let activePeriodDay: number | null = null;

  if (latestCycle.end_date === null || latestCycle.end_date === undefined) {
    // Open period: considered active if reference date is on or after start_date and within 14 days
    if (daysSinceLatestStart >= 0 && daysSinceLatestStart < 14) {
      isPeriodActive = true;
      activePeriodDay = daysSinceLatestStart + 1;
    }
  } else {
    // Has explicit end date: check if refDate is between start_date and end_date inclusive
    const latestEnd = parseDateString(latestCycle.end_date);
    if (refDateNoTime.getTime() >= latestStart.getTime() && refDateNoTime.getTime() <= latestEnd.getTime()) {
      isPeriodActive = true;
      activePeriodDay = daysSinceLatestStart + 1;
    }
  }

  // 3. Calculate Historical Cycle Lengths (intervals between consecutive start dates)
  const cycleLengths: number[] = [];
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const startA = parseDateString(sortedCycles[i].start_date);
    const startB = parseDateString(sortedCycles[i + 1].start_date);
    const length = diffDays(startA, startB);
    if (length >= 15 && length <= 90) {
      cycleLengths.push(length);
    }
  }

  // 4. Calculate Average Cycle Length
  let calculatedCycleLength = fallbackCycleLength;
  const hasSufficientData = cycleLengths.length >= 1;

  if (cycleLengths.length === 1) {
    calculatedCycleLength = cycleLengths[0];
  } else if (cycleLengths.length > 1) {
    const recent = cycleLengths.slice(-6);
    const sum = recent.reduce((acc, val) => acc + val, 0);
    calculatedCycleLength = Math.round(sum / recent.length);
  }

  calculatedCycleLength = Math.max(20, Math.min(50, calculatedCycleLength));

  // 5. Calculate Average Period Duration
  const periodDurations: number[] = [];
  for (const c of sortedCycles) {
    if (c.end_date) {
      const s = parseDateString(c.start_date);
      const e = parseDateString(c.end_date);
      const duration = diffDays(s, e) + 1;
      if (duration >= 1 && duration <= 14) {
        periodDurations.push(duration);
      }
    }
  }

  let calculatedPeriodDuration = fallbackPeriodDuration;
  if (periodDurations.length > 0) {
    const sumDuration = periodDurations.reduce((acc, val) => acc + val, 0);
    calculatedPeriodDuration = Math.round(sumDuration / periodDurations.length);
  }

  // 6. Predict Next Period Start Date and Window
  const nextStartDate = new Date(latestStart);
  nextStartDate.setDate(nextStartDate.getDate() + calculatedCycleLength);
  const estimatedNextPeriodStart = formatDateString(nextStartDate);

  // Estimation window: +/- 2 days around expected start
  const estimatedPeriodWindow = {
    start: addDays(estimatedNextPeriodStart, -2),
    end: addDays(estimatedNextPeriodStart, 2),
  };

  // 7. Estimated Ovulation Date (typically 14 days before next cycle start in standard luteal phase)
  const ovulationDate = new Date(nextStartDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);
  const estimatedOvulationDate = formatDateString(ovulationDate);

  return {
    currentCycleDay,
    isPeriodActive,
    activePeriodDay,
    averageCycleLength: calculatedCycleLength,
    averagePeriodDuration: calculatedPeriodDuration,
    hasSufficientData,
    totalCyclesLogged: sortedCycles.length,
    estimatedNextPeriodStart,
    estimatedPeriodWindow,
    estimatedOvulationDate,
    cycleLengthHistory: cycleLengths,
    disclaimer,
  };
}
