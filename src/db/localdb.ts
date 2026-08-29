

import Dexie, { type Table } from 'dexie'

export interface CachedRecord {
  id: string
  type: 'weather' | 'mandiPrice' | 'scheme' | 'soilReport' | 'yieldPrediction'
  data: any
  fetchedAt: number
}

// A write the user made while offline (or that we chose to queue instead
// of sending immediately), waiting to reach Supabase.
export interface PendingAction {
  id?: number                // Dexie's own local auto-increment id
  recordId: string           // the UUID we generated for the actual row —
                              // see 04-queueAction.ts for why this matters
  table: string               // e.g. 'disease_reports', 'soil_reports'
  operation: 'insert' | 'update' | 'edgeFunction'
  edgeFunctionName?: string   // only set when operation === 'edgeFunction'
  payload: any
  expectedVersion?: number    // only relevant for 'update' — see step 05
  createdAt: number
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
  lastError?: string
}

class KrishiSahayakDB extends Dexie {
  cachedRecords!: Table<CachedRecord, string>
  pendingActions!: Table<PendingAction, number>

  constructor() {
    super('KrishiSahayakDB')
    this.version(1).stores({
      // Indexes: 'id' is the primary key; 'type' and 'fetchedAt' are
      // indexed so we can query "all cached mandi prices" or "oldest
      // cached entries to evict" efficiently.
      cachedRecords: 'id, type, fetchedAt',

      // '++id' = auto-increment primary key. 'status' and 'createdAt'
      // indexed so syncManager can efficiently pull "pending, oldest first".
      pendingActions: '++id, status, createdAt, recordId'
    })
  }
}

export const db = new KrishiSahayakDB()