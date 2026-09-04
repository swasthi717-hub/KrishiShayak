
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/localDb'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const pendingCount = useLiveQuery(
    () => db.pendingActions.where('status').anyOf('pending', 'syncing').count(),
    [],
    0
  )

  const failedActions = useLiveQuery(
    () => db.pendingActions.where('status').equals('failed').toArray(),
    [],
    []
  )

  const conflicts = (failedActions ?? []).filter(a => a.lastError === 'conflict')
  const permanentFailures = (failedActions ?? []).filter(a => a.lastError !== 'conflict')

  return {
    isOnline,
    pendingCount: pendingCount ?? 0,
    conflicts,          // show a "resolve" prompt for these
    permanentFailures   // show an error/review prompt for these
  }
}

// Example usage in a header/status-bar component:
//
// const { isOnline, pendingCount, conflicts } = useOfflineSync()
//
// {!isOnline && <Badge>Offline — changes will sync automatically</Badge>}
// {pendingCount > 0 && <Badge>{pendingCount} pending sync</Badge>}
// {conflicts.length > 0 && <Badge variant="warning">{conflicts.length} need review</Badge>}