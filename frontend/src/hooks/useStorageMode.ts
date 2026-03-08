import { useState, useEffect } from 'react'
import type { StorageMode } from '../lib/storage.ts'

export type StorageResolution = StorageMode | 'pending'

export function useStorageMode(): StorageResolution {
  const [mode, setMode] = useState<StorageResolution>('pending')

  useEffect(() => {
    fetch('/api/storage-mode')
      .then(res => res.json())
      .then(data => setMode(data.storageMode as StorageMode))
      .catch(() => setMode('local')) // fallback: backend unreachable → local
  }, [])

  return mode
}
