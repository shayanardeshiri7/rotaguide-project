import { useMemo } from 'react';
import { useStore } from './useStore';
import { recommendNextZone } from '@/domain/recommend';
import { detectRepeatRisk, findRepeatAlerts } from '@/domain/repeat';
import {
  adherenceByRegion,
  adherencePercent,
  calculateStreak,
  dailyCounts,
  sortByTime,
  zoneUsageCounts,
} from '@/domain/adherence';

/**
 * Derived state.
 *
 * Nothing here is stored — every value is recomputed from the log list by
 * the pure domain layer. Changing an algorithm therefore never requires
 * a data migration, and the numbers on screen can never drift out of
 * sync with the history that produced them.
 */

export function useRecommendation() {
  const logs = useStore((s) => s.logs);
  const region = useStore((s) => s.selectedRegion);
  const zoneCount = useStore((s) => s.zoneCount);
  return useMemo(
    () => recommendNextZone(logs, region, zoneCount),
    [logs, region, zoneCount],
  );
}

export function useRepeatRisk(zone: number | null) {
  const logs = useStore((s) => s.logs);
  const region = useStore((s) => s.selectedRegion);
  const zoneCount = useStore((s) => s.zoneCount);
  const threshold = useStore((s) => s.threshold);
  return useMemo(
    () =>
      zone === null
        ? null
        : detectRepeatRisk(logs, region, zone, zoneCount, threshold),
    [logs, region, zone, zoneCount, threshold],
  );
}

export function useZoneUsage() {
  const logs = useStore((s) => s.logs);
  const region = useStore((s) => s.selectedRegion);
  const zoneCount = useStore((s) => s.zoneCount);
  return useMemo(
    () => zoneUsageCounts(logs, region, zoneCount),
    [logs, region, zoneCount],
  );
}

export function useHistoryStats() {
  const logs = useStore((s) => s.logs);
  const zoneCount = useStore((s) => s.zoneCount);
  return useMemo(
    () => ({
      total: logs.length,
      streak: calculateStreak(logs),
      adherence: adherencePercent(logs, zoneCount),
    }),
    [logs, zoneCount],
  );
}

/** Newest first — the order the history list reads in. */
export function useRecentLogs(limit = 30) {
  const logs = useStore((s) => s.logs);
  return useMemo(() => [...sortByTime(logs)].reverse().slice(0, limit), [logs, limit]);
}

export function useInsights(windowDays: number) {
  const logs = useStore((s) => s.logs);
  const zoneCount = useStore((s) => s.zoneCount);
  const threshold = useStore((s) => s.threshold);
  return useMemo(
    () => ({
      daily: dailyCounts(logs, windowDays),
      byRegion: adherenceByRegion(logs, zoneCount),
      alerts: findRepeatAlerts(logs, zoneCount, threshold),
    }),
    [logs, zoneCount, threshold, windowDays],
  );
}
