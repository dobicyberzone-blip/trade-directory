import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Normalize a business name for comparison:
 * - Lowercase
 * - Remove punctuation (periods, commas, hyphens, apostrophes, etc.)
 * - Collapse multiple spaces
 * - Trim
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // replace all punctuation/symbols with space
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

/**
 * Split normalized name into meaningful words, filtering out common suffixes
 * that shouldn't count as differentiators (ltd, limited, co, company, etc.)
 */
const NOISE_WORDS = new Set(['ltd', 'limited', 'co', 'company', 'inc', 'incorporated', 'llc', 'plc', 'group', 'enterprises', 'enterprise', 'and', 'the', 'of', 'for', 'a']);

function getWords(normalized: string): string[] {
  return normalized.split(' ').filter(w => w.length > 0);
}

function getCoreWords(normalized: string): string[] {
  return getWords(normalized).filter(w => !NOISE_WORDS.has(w));
}

/**
 * Jaccard similarity between two sets of words.
 * Returns 0.0 (no overlap) to 1.0 (identical).
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if two normalized names are "too similar":
 * 1. Exact match after normalization
 * 2. Core-word Jaccard similarity >= 0.85 (catches "Savannah Agro Exporters Ltd" vs "Savannah Agro Exporters Ltd.")
 * 3. One name contains all core words of the other (subset match)
 */
function isTooSimilar(inputNorm: string, dbNorm: string): boolean {
  // Exact normalized match
  if (inputNorm === dbNorm) return true;

  const inputCore = getCoreWords(inputNorm);
  const dbCore = getCoreWords(dbNorm);

  // If either has no core words, fall back to full word comparison
  const a = inputCore.length > 0 ? inputCore : getWords(inputNorm);
  const b = dbCore.length > 0 ? dbCore : getWords(dbNorm);

  // High Jaccard similarity
  if (jaccardSimilarity(a, b) >= 0.85) return true;

  // Subset: all core words of input appear in db name (or vice versa)
  if (a.length > 0 && b.length > 0) {
    const setB = new Set(b);
    const setA = new Set(a);
    const inputInDb = a.every(w => setB.has(w));
    const dbInInput = b.every(w => setA.has(w));
    if (inputInDb || dbInInput) return true;
  }

  return false;
}

/**
 * GET /api/auth/check-business-name?name=...
 * Returns { available: boolean, similarTo?: string }
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: 'Business name too short' },
      { status: 400, headers: corsHeaders }
    );
  }

  const inputNorm = normalize(name);

  // Fetch all business names (only the name field — lightweight)
  const allBusinesses = await prisma.business.findMany({
    select: { id: true, name: true },
  });

  const match = allBusinesses.find(b => isTooSimilar(inputNorm, normalize(b.name)));

  return NextResponse.json(
    {
      available: !match,
      ...(match ? { similarTo: match.name } : {}),
    },
    { headers: corsHeaders }
  );
}
