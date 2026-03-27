/**
 * useMasterData — fetches Industries and Sectors from the DB via /api/master-data.
 * Falls back to constants.ts if the DB is empty or unreachable.
 * Results are cached in sessionStorage for 5 minutes so every component
 * that calls this hook gets instant data on repeat renders.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { INDUSTRIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';

interface MasterIndustry { id: string; name: string }
interface MasterSector   { id: string; name: string }

interface MasterDataState {
  industries: MasterIndustry[];
  /** Map of industryName → sector names (same shape as SECTORS_BY_INDUSTRY) */
  sectorsByIndustry: Record<string, string[]>;
  /** Flat list of all active sector names */
  allSectors: string[];
  loading: boolean;
}

const CACHE_KEY = 'master_data_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function readCache(): MasterDataState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(data: Omit<MasterDataState, 'loading'>) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
}

// Build the constants fallback shape
function constantsFallback(): Omit<MasterDataState, 'loading'> {
  const sectorsByIndustry: Record<string, string[]> = {};
  for (const [ind, sectors] of Object.entries(SECTORS_BY_INDUSTRY)) {
    sectorsByIndustry[ind] = sectors;
  }
  return {
    industries: INDUSTRIES.map(name => ({ id: name, name })),
    sectorsByIndustry,
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
      // Fetch industries
      const iRes = await fetch('/api/master-data');
      const iData = await iRes.json();

      if (!iData.industries?.length) {
        // DB empty — use constants
        const fb = constantsFallback();
        setState({ ...fb, loading: false });
        writeCache(fb);
        return;
      }

      const industries: MasterIndustry[] = iData.industries;

      // Fetch sectors for each industry in parallel (batched)
      const sectorsByIndustry: Record<string, string[]> = {};
      await Promise.all(
        industries.map(async ind => {
          try {
            const sRes = await fetch(`/api/master-data?industryId=${encodeURIComponent(ind.id)}`);
            const sData = await sRes.json();
            sectorsByIndustry[ind.name] = (sData.sectors || []).map((s: MasterSector) => s.name);
          } catch {
            // fallback for this industry
            sectorsByIndustry[ind.name] = SECTORS_BY_INDUSTRY[ind.name] || [];
          }
        })
      );

      const allSectors = Object.values(sectorsByIndustry).flat();
      const result = { industries, sectorsByIndustry, allSectors };
      setState({ ...result, loading: false });
      writeCache(result);
    } catch {
      // Network error — keep constants
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
