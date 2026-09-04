
import { db, type PendingAction } from '../db/localDb'
import { supabase } from '../lib/supabase' // your existing supabase-js client

const MAX_RETRIES = 5

class SyncManager {
  private syncing = false

  constructor() {
    // Primary trigger: browser fires this when connectivity is restored.
    window.addEventListener('online', () => this.trigger())

    // Safety net: 'online' event isn't 100% reliable on every device/OS,
    // and Background Sync (step 04) isn't supported on iOS Safari at all.
    // A periodic check costs almost nothing and closes that gap.
    setInterval(() => {
      if (navigator.onLine) this.trigger()
    }, 60_000)
  }

  async trigger() {
    if (this.syncing || !navigator.onLine) return
    this.syncing = true
    try {
      // Order matters: if a soil report was created then edited while
      // offline, both actions must apply in that order, or the edit could
      // be silently lost.
      const pending = await db.pendingActions
        .where('status')
        .anyOf('pending', 'failed')
        .sortBy('createdAt')

      for (const action of pending) {
        await this.syncOne(action)
      }
    } finally {
      this.syncing = false
    }
  }

  private async syncOne(action: PendingAction) {
    await db.pendingActions.update(action.id!, { status: 'syncing' })

    try {
      if (action.operation === 'edgeFunction') {
        await this.syncEdgeFunction(action)
      } else if (action.operation === 'insert') {
        await this.syncInsert(action)
      } else {
        await this.syncUpdate(action)
      }
      await db.pendingActions.delete(action.id!)
    } catch (err: any) {
      await this.handleFailure(action, err)
    }
  }

  // INSERT: uses upsert on the client-generated id. If this exact action
  // already succeeded on a previous attempt (network died after Supabase
  // received it but before we got the response), this simply overwrites
  // the row with identical data — safe, no duplicate created. This is the
  // idempotency trick from 00-README section 4, replacing what an Express
  // idempotency-keys table would have done.
  private async syncInsert(action: PendingAction) {
    const { error } = await supabase
      .from(action.table)
      .upsert(action.payload, { onConflict: 'id' })
    if (error) throw error
  }

  // UPDATE: conditioned on the version the client last saw. Zero rows
  // returned means someone else's edit landed first — that's a real
  // conflict, not a network error, so we handle it differently below.
  private async syncUpdate(action: PendingAction) {
    const { data, error } = await supabase
      .from(action.table)
      .update({ ...action.payload, version: (action.expectedVersion ?? 0) + 1 })
      .eq('id', action.recordId)
      .eq('version', action.expectedVersion ?? 0)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      const conflictError = new Error('version_conflict')
      ;(conflictError as any).isConflict = true
      throw conflictError
    }
  }

  // EDGE FUNCTION: e.g. disease detection, which needs the Gemini API key
  // server-side. clientRequestId (set in queueAction.ts) lets the Edge
  // Function itself check "have I already processed this?" — see
  // 08-supabase-migration.sql for the table it checks against.
  private async syncEdgeFunction(action: PendingAction) {
    const { error } = await supabase.functions.invoke(action.edgeFunctionName!, {
      body: action.payload
    })
    if (error) throw error
  }

  private async handleFailure(action: PendingAction, err: any) {
    const isConflict = err?.isConflict === true
    // Postgres/PostgREST errors carry a `code`; RLS denials and check-
    // constraint violations are permanent, not worth retrying.
    const isPermanent = ['23505', '23514', '42501'].includes(err?.code)

    if (isConflict) {
      await db.pendingActions.update(action.id!, {
        status: 'failed',
        lastError: 'conflict'
      })
      // The UI (via useOfflineSync, step 07) can watch for status:'failed'
      // + lastError:'conflict' and prompt the user to review/merge.
      return
    }

    if (isPermanent) {
      await db.pendingActions.update(action.id!, {
        status: 'failed',
        lastError: err.message
      })
      return
    }

    const retryCount = action.retryCount + 1
    await db.pendingActions.update(action.id!, {
      status: retryCount > MAX_RETRIES ? 'failed' : 'pending',
      retryCount,
      lastError: err.message
    })
  }
}

export const syncManager = new SyncManager()