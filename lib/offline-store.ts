export interface QueuedCheckIn {
  id: string // Client-generated UUID
  memberId: string
  badgeId?: string
  fullName?: string
  session: string
  isPresent: boolean
  isLate: boolean
  scannedAt: string // ISO string timestamp recorded at button tap
  recordedBy: string // Leader name
  groupName?: string
  createdAt: number
}

const ROSTER_CACHE_KEY_PREFIX = "mor_roster_cache_"
const OFFLINE_QUEUE_KEY = "mor_offline_checkins_queue"

export function isClient(): boolean {
  return typeof window !== "undefined"
}

// 1. Cache full roster locally
export function saveCachedRoster(session: string, members: any[]): void {
  if (!isClient()) return
  try {
    const key = `${ROSTER_CACHE_KEY_PREFIX}${session}`
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), members }))
  } catch (err) {
    console.warn("Notice saving roster to local cache:", err)
  }
}

// 2. Retrieve cached roster when offline
export function getCachedRoster(session: string): any[] | null {
  if (!isClient()) return null
  try {
    const key = `${ROSTER_CACHE_KEY_PREFIX}${session}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.members) ? parsed.members : null
  } catch (err) {
    console.warn("Notice reading roster from local cache:", err)
    return null
  }
}

// 3. Queue a check-in while offline
export function enqueueOfflineCheckIn(item: QueuedCheckIn): void {
  if (!isClient()) return
  try {
    const queue = getOfflineQueue()
    // Upsert by memberId + session in queue
    const filtered = queue.filter(
      (q) => !(q.memberId === item.memberId && q.session === item.session)
    )
    filtered.push(item)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.error("Failed to enqueue offline check-in:", err)
  }
}

// 4. Retrieve entire offline queue
export function getOfflineQueue(): QueuedCheckIn[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn("Notice reading offline queue:", err)
    return []
  }
}

// 5. Remove synced items from queue
export function clearSyncedItems(syncedIds: string[]): void {
  if (!isClient()) return
  try {
    const queue = getOfflineQueue()
    const idSet = new Set(syncedIds)
    const remaining = queue.filter((item) => !idSet.has(item.id))
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
  } catch (err) {
    console.warn("Notice clearing synced items:", err)
  }
}

// 6. Overlay local offline queue onto loaded roster members
export function applyOfflineQueueToMembers(
  members: any[],
  session: string
): { mergedMembers: any[]; pendingCount: number } {
  const queue = getOfflineQueue().filter((q) => q.session === session)
  if (queue.length === 0) {
    return { mergedMembers: members, pendingCount: 0 }
  }

  const queueMap = new Map<string, QueuedCheckIn>()
  queue.forEach((q) => queueMap.set(q.memberId, q))

  const merged = members.map((m) => {
    const queued = queueMap.get(m.id)
    if (!queued) return m
    return {
      ...m,
      isPresent: queued.isPresent,
      isLate: queued.isLate,
      scannedAt: queued.scannedAt,
      recordedBy: queued.recordedBy,
      isOfflinePending: true,
    }
  })

  return { mergedMembers: merged, pendingCount: queue.length }
}
