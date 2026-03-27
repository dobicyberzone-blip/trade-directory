/**
 * useMasterData — fetches active Industries and Sectors from the DB via /api/master-data.
 * Falls back to constants.ts if the DB is empty or unreachable.
 *
 * Cache strategy:
 *  - sessionStorage TTL: 60 seconds
 *  - localStorage 'master_data_version' is bumped by the admin master-data page on every
 *    create/update/delete. If the cached version doesn't match, the cache is busted
 *    immediately so disabled/renamed items disappear without waiting for TTL.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { INDUSTRIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';

interface MasterIndustry { id: string; name: string }
interface MasterSector   { id: string; name: string }

interface MasterDataState {
  industries: MasterIndustry[];
  sectorsByIndustry: Record<string, string[]>;
  /** Full sector objects keyed by industry name — needed to resolve sector ID from name */
  sectorObjectsByIndustry: Record<string, MasterSector[]>;
  allSectors: string[];
  loading: boolean;
}

const CACHE_KEY   = 'master_data_v2';
const VERSION_KEY = 'master_data_version';
const CACHE_TTL   = 60 * 1000; // 60 seconds

/** Bump this from the admin page after any create/update/delete */
export function bustMasterDataCache() {
  try {
    const v = String(Date.now());
    localStorage.setItem(VERSION_KEY, v);
    sessionStorage.removeItem(CACHE_KEY);
  } catch { /* quota / SSR */ }
}

function readCache(): MasterDataState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts, version } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    // Bust if admin has made a change since this was cached
    const currentVersion = localStorage.getItem(VERSION_KEY) ?? '0';
    if (version !== currentVersion) return null;
    return data;
  } catch { return null; }
}

function writeCache(data: Omit<MasterDataState, 'loading'>) {
  try {
    const version = localStorage.getItem(VERSION_KEY) ?? '0';
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now(), version }));
  } catch { /* quota */ }
}

function constantsFallback(): Omit<MasterDataState, 'loading'> {
  const sectorsByIndustry: Record<string, string[]> = {};
  const sectorObjectsByIndustry: Record<string, MasterSector[]> = {};
  for (const [ind, sectors] of Object.entries(SECTORS_BY_INDUSTRY)) {
    sectorsByIndustry[ind] = sectors;
    sectorObjectsByIndustry[ind] = sectors.map(name => ({ id: name, name }));
  }
  return {
    industries: INDUSTRIES.map(name => ({ id: name, name })),
    sectorsByIndustry,
    sectorObjectsByIndustry,
    allSectors: Object.values(SECTORS_BY_INDUSTRY).flat(),
  };
}

export function useMasterData(): MasterDataState {
  const cached = typeof window !== 'undefined' ? readCache() : null;

  const [state, setState] = useState<MasterDataState>(() => ({
    ...(cached || constantsFallback()),
    loading: !cached,
  }));

  const fetch_ = useCallback(async () => {
    try {
      const iRes = await fetch('/api/master-data');
      const iData = await iRes.json();

      if (!iData.industries?.length) {
        const fb = constantsFallback();
        setState({ ...fb, loading: false });
        writeCache(fb);
        return;
      }

      const industries: MasterIndustry[] = iData.industries;

      const sectorsByIndustry: Record<string, string[]> = {};
      const sectorObjectsByIndustry: Record<string, MasterSector[]> = {};
      await Promise.all(
        industries.map(async ind => {
          try {
            const sRes = await fetch(`/api/master-data?industryId=${encodeURIComponent(ind.id)}`);
            const sData = await sRes.json();
            const sectors: MasterSector[] = sData.sectors || [];
            sectorsByIndustry[ind.name] = sectors.map((s: MasterSector) => s.name);
            sectorObjectsByIndustry[ind.name] = sectors;
          } catch {
            sectorsByIndustry[ind.name] = SECTORS_BY_INDUSTRY[ind.name] || [];
            sectorObjectsByIndustry[ind.name] = (SECTORS_BY_INDUSTRY[ind.name] || []).map(name => ({ id: name, name }));
          }
        })
      );

      const allSectors = Object.values(sectorsByIndustry).flat();
      const result = { industries, sectorsByIndustry, sectorObjectsByIndustry, allSectors };
      setState({ ...result, loading: false });
      writeCache(result);
    } catch {
      const fb = constantsFallback();
      setState({ ...fb, loading: false });
    }
  }, []);

  useEffect(() => {
    if (!readCache()) fetch_();
    else setState(s => ({ ...s, loading: false }));
  }, [fetch_]);

  return state;
}
