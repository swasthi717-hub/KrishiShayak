

import { v4 as uuidv4 } from 'uuid'
import { db, type PendingAction } from '../db/localDb'
import { syncManager } from './syncManager'

interface QueueTableWriteArgs {
  table: string
  operation: 'insert' | 'update'
  payload: Record<string, any>   // must NOT include `id` for inserts —
                                  // we generate it here
  expectedVersion?: number        // required for 'update', see 05-syncManager.ts
  existingId?: string             // required for 'update'
}

/**
 * Queue a plain table write (disease_reports, soil_reports, yield entries,
 * alerts, etc.) against Supabase Postgres directly.
 */
export async function queueTableWrite(args: QueueTableWriteArgs): Promise<string> {
  const recordId = args.operation === 'insert' ? uuidv4() : args.existingId!

  const action: Omit<PendingAction, 'id'> = {
    recordId,
    table: args.table,
    operation: args.operation,
    payload: args.operation === 'insert' ? { ...args.payload, id: recordId } : args.payload,
    expectedVersion: args.expectedVersion,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0
  }

  await db.pendingActions.add(action)
  await triggerSyncSoon()
  return recordId
}

interface QueueEdgeFunctionArgs {
  functionName: string   // e.g. 'analyze-disease' — see 08 for why this
                          // needs to be a Supabase Edge Function and not
                          // a direct table write
  payload: Record<string, any>
}

/**
 * Queue a call to a Supabase Edge Function — used for anything needing
 * server-side secrets or multi-step logic (e.g. sending a crop photo to
 * Gemini for disease analysis; we don't want the Gemini key in the React
 * bundle, so this can't just be a direct table insert).
 */
export async function queueEdgeFunctionCall(args: QueueEdgeFunctionArgs): Promise<string> {
  const recordId = uuidv4() // used as the idempotency key the Edge Function checks

  const action: Omit<PendingAction, 'id'> = {
    recordId,
    table: '', // n/a for edge function calls
    operation: 'edgeFunction',
    edgeFunctionName: args.functionName,
    payload: { ...args.payload, clientRequestId: recordId },
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0
  }

  await db.pendingActions.add(action)
  await triggerSyncSoon()
  return recordId
}

async function triggerSyncSoon() {
  if (navigator.onLine) {
    syncManager.trigger()
  } else if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // Background Sync API — see note in 05-syncManager.ts about support.
    const reg = await navigator.serviceWorker.ready
    await (reg as any).sync.register('krishisahayak-sync')
  }
  // If neither applies (e.g. iOS Safari, offline right now), syncManager's
  // own 'online' event listener and periodic check will pick it up later —
  // nothing more to do here.
}