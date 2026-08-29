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

// Import the Dexie DB and helper
import { db, bulkAddAttendance } from "@/lib/local-db"

// Helper to write a single attendance record to IndexedDB
const persistAttendanceInDB = async (item: QueuedCheckIn) => {
  try {
    await db.attendance.put({
      id: item.id,
      memberId: item.memberId,
      session: item.session,
      isPresent: item.isPresent,
      isLate: item.isLate,
      scannedAt: item.scannedAt,
      recordedBy: item.recordedBy ?? null,
    })
  } catch (e) {
    console.warn("Failed to persist offline attendance in IndexedDB", e)
  }
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
    // Also persist to IndexedDB for durability
    persistAttendanceInDB(item)
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

/**
 * Sync the offline queue with the server when online.
 * Uses the existing bulk attendance endpoint.
 */
export async function syncOfflineQueue(): Promise<void> {
  if (!isClient()) return;
  if (navigator.onLine === false) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  try {
    const resp = await fetch("/api/camp/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIns: queue }),
    });
    if (!resp.ok) throw new Error(`Sync failed: ${resp.status}`);

    // Successful – clear sent items
    const syncedIds = queue.map((i) => i.id);
    clearSyncedItems(syncedIds);
    console.info("[offline-store] Synced", syncedIds.length, "check‑ins");
  } catch (err) {
    console.warn("[offline-store] Unable to sync offline queue now – will retry later", err);
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

// Flush offline queue to server when back online
export async function flushOfflineQueue(): Promise<void> {
  if (!isClient()) return
  const queue = getOfflineQueue()
  if (queue.length === 0) return
  try {
    const res = await fetch("/api/camp/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SYNC_OFFLINE_QUEUE", items: queue }),
    })
    const json = await res.json()
    if (json.success) {
      // Remove synced items from localStorage queue
      clearSyncedItems(queue.map((i) => i.id))
      // Also clean them from IndexedDB
      await db.attendance.bulkDelete(queue.map((i) => i.id))
      console.log("✅ Offline queue synced successfully")
    } else {
      console.warn("Server rejected offline sync:", json.error)
    }
  } catch (e) {
    console.warn("Failed to sync offline queue:", e)
  }
}

if (isClient()) {
  window.addEventListener("online", () => {
    console.log("🌐 Online – attempting to flush offline queue")
    flushOfflineQueue()
  })
}
