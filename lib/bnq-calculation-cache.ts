/**
 * BNQ Calculation Cache v1.0
 * 
 * Système de cache/mémoïsation pour les calculs BNQ Ultimate
 * Évite de recalculer tout le dataset à chaque appel
 */

import {
  BNQCalculationResult,
  calculateBNQResults,
  CompanyContext,
  ResponseData,
} from './bnq-calculation-engine';

// Cache entry structure
interface CacheEntry {
  result: BNQCalculationResult;
  responseCount: number;
  calculatedAt: Date;
  hash: string;
}

// In-memory cache (could be replaced with Redis in production)
const calculationCache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Generate a hash for the responses to detect changes
 */
function generateResponsesHash(responses: ResponseData[][]): string {
  const stringified = JSON.stringify(
    responses.map(r => r.sort((a, b) => a.questionId.localeCompare(b.questionId)))
  );
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < stringified.length; i++) {
    const char = stringified.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Get cached result or calculate new one
 */
export function getCachedBNQResults(
  campaignId: string,
  responses: ResponseData[][],
  company: CompanyContext,
  config: {
    targetPopulation?: number;
    activeModules: number[];
    module1Threshold?: number;
    module3Threshold?: number;
  },
  forceRecalculate: boolean = false
): { result: BNQCalculationResult; fromCache: boolean; cacheAge?: number } {
  const cacheKey = campaignId;
  const responsesHash = generateResponsesHash(responses);
  const now = new Date();
  
  // Check if we have a valid cached result
  if (!forceRecalculate) {
    const cached = calculationCache.get(cacheKey);
    
    if (cached) {
      const cacheAge = now.getTime() - cached.calculatedAt.getTime();
      
      // Valid cache: same hash and not expired
      if (cached.hash === responsesHash && cacheAge < CACHE_TTL) {
        return {
          result: cached.result,
          fromCache: true,
          cacheAge: Math.round(cacheAge / 1000), // seconds
        };
      }
      
      // Same response count but hash changed - partial update possible
      if (cached.responseCount === responses.length && cached.hash !== responsesHash) {
        console.log(`[BNQ Cache] Hash changed for ${campaignId}, recalculating...`);
      }
    }
  }
  
  // Calculate new result
  const result = calculateBNQResults(responses, company, config);
  
  // Store in cache
  calculationCache.set(cacheKey, {
    result,
    responseCount: responses.length,
    calculatedAt: now,
    hash: responsesHash,
  });
  
  return {
    result,
    fromCache: false,
  };
}

/**
 * Invalidate cache for a campaign
 */
export function invalidateCache(campaignId: string): void {
  calculationCache.delete(campaignId);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  calculationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  campaigns: string[];
  oldestEntry: Date | null;
} {
  const entries = calculationCache.size;
  const campaigns = Array.from(calculationCache.keys());
  let oldestEntry: Date | null = null;
  
  for (const entry of calculationCache.values()) {
    if (!oldestEntry || entry.calculatedAt < oldestEntry) {
      oldestEntry = entry.calculatedAt;
    }
  }
  
  return { entries, campaigns, oldestEntry };
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of calculationCache.entries()) {
    if (now - entry.calculatedAt.getTime() > CACHE_TTL) {
      calculationCache.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}

// Periodically clean up expired entries (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[BNQ Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, 10 * 60 * 1000);
}
