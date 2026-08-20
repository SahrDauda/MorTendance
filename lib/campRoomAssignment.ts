import { db } from "@/lib/db"

export interface AssignRoomParams {
  gender: string
  branch?: string | null
  position?: string | null
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Automatically & randomly assigns a member to an eligible room matching their gender,
 * balancing occupancy across rooms while spreading delegates.
 */
export async function assignRandomCampRoom({
  gender,
  branch,
}: AssignRoomParams): Promise<string | null> {
  const normGender = (gender || "Male").toLowerCase() === "female" ? "Female" : "Male"

  // 1. Fetch all rooms for this gender
  const rooms = await db.campRoom.findMany({
    where: {
      gender: normGender,
    },
    orderBy: { name: "asc" },
  })

  if (rooms.length === 0) return null

  // 2. Fetch current occupants per room
  const roomStats = await Promise.all(
    rooms.map(async (room: any) => {
      const occupants = await db.campMember.findMany({
        where: { room: room.name },
        select: { id: true, branch: true },
      })

      const sameBranchCount = branch
        ? occupants.filter((o: any) => o.branch === branch).length
        : 0

      return {
        room,
        totalOccupants: occupants.length,
        sameBranchCount,
        hasCapacity: occupants.length < room.capacity,
        availableSlots: Math.max(0, room.capacity - occupants.length),
      }
    })
  )

  // 3. Filter to rooms with available capacity
  const availableRooms = roomStats.filter((r) => r.hasCapacity)

  if (availableRooms.length === 0) {
    // If all rooms are at capacity, fallback to the room with the lowest occupancy
    const sorted = shuffle([...roomStats]).sort(
      (a, b) => a.totalOccupants - b.totalOccupants
    )
    return sorted[0]?.room.name || rooms[0].name
  }

  // 4. Find lowest occupancy among available to keep allocations balanced
  const minOccupancy = Math.min(...availableRooms.map((r) => r.totalOccupants))
  
  // Candidates are rooms within a low occupancy window (e.g. minOccupancy + 2)
  let candidateRooms = availableRooms.filter(
    (r) => r.totalOccupants <= minOccupancy + 2
  )

  // Further prefer rooms with fewer delegates from the same branch if branch is specified
  if (branch) {
    const minSameBranch = Math.min(...candidateRooms.map((r) => r.sameBranchCount))
    const branchCandidates = candidateRooms.filter(
      (r) => r.sameBranchCount <= minSameBranch + 1
    )
    if (branchCandidates.length > 0) {
      candidateRooms = branchCandidates
    }
  }

  // 5. Randomly pick from candidates
  const shuffledCandidates = shuffle(candidateRooms)
  return shuffledCandidates[0].room.name
}
