
import { db, type CachedRecord } from '../db/localDb'
import { supabase } from '../lib/supabaseClient'

interface FetchWithCacheResult<T> {
  data: T
  fromCache: boolean
  fetchedAt: number
}

/**
 * Fetch a single row (or small result set) with offline fallback.
 * Example: fetchWithCache('soilReport', 'soil_reports', (q) => q.eq('id', reportId).single())
 */
export async function fetchWithCache<T>(
  cacheType: CachedRecord['type'],
  cacheId: string,
  queryFn: () => PromiseLike<{ data: T | null; error: any }>
): Promise<FetchWithCacheResult<T>> {
  try {
    const { data, error } = await queryFn()
    if (error) throw error
    if (data === null) throw new Error('no data returned')

    const fetchedAt = Date.now()
    await db.cachedRecords.put({ id: cacheId, type: cacheType, data, fetchedAt })
    return { data, fromCache: false, fetchedAt }
  } catch (err) {
    const cached = await db.cachedRecords.get(cacheId)
    if (cached) {
      return { data: cached.data as T, fromCache: true, fetchedAt: cached.fetchedAt }
    }
    throw err // genuinely nothing to show — let the UI render an empty/error state
  }
}

// Example usage in a component or data hook:
//
// const { data, fromCache, fetchedAt } = await fetchWithCache(
//   'mandiPrice',
//   `mandi-${cropId}-${mandiId}`,
//   () => supabase.from('mandi_prices').select('*').eq('crop_id', cropId).eq('mandi_id', mandiId).single()
// )
//
// if (fromCache) {
//   // show: "Prices from Xh ago — may not reflect today's market"
// }
//
// This banner matters more here than in most apps: a mandi price that's
// two days stale could genuinely cost a farmer money if they act on it
// without knowing it's not live.