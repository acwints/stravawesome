'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      
      router.refresh()
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
    >
      {isSyncing ? 'Syncing...' : 'Sync Activities'}
    </button>
  )
} 