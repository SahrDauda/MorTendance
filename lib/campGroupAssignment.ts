import { db } from "@/lib/db"

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const DEFAULT_CAMP_GROUPS = [
  { name: "Group 1 (Elijah)", color: "#3B82F6" },
  { name: "Group 2 (Deborah)", color: "#EC4899" },
  { name: "Group 3 (David)", color: "#10B981" },
  { name: "Group 4 (Esther)", color: "#8B5CF6" },
  { name: "Group 5 (Daniel)", color: "#F59E0B" },
  { name: "Group 6 (Joshua)", color: "#06B6D4" },
  { name: "Group 7 (Gideon)", color: "#EF4444" },
  { name: "Group 8 (Hannah)", color: "#14B8A6" },
]

/**
 * Ensures camp groups exist, and randomly assigns an attendee to the least-populated group.
 */
export async function assignRandomCampGroup(): Promise<string> {
  // 1. Fetch existing groups
  let groups = await db.campGroup.findMany({
    orderBy: { name: "asc" },
  })

  // 2. If no groups exist, seed default groups
  if (groups.length === 0) {
    for (const g of DEFAULT_CAMP_GROUPS) {
      await db.campGroup.upsert({
        where: { name: g.name },
        update: {},
        create: { name: g.name, color: g.color },
      })
    }
    groups = await db.campGroup.findMany({ orderBy: { name: "asc" } })
  }

  if (groups.length === 0) return "General Group"

  // 3. Find current member count per group to balance distribution
  const groupStats = await Promise.all(
    groups.map(async (group: any) => {
      const count = await db.campMember.count({
        where: { caregroup: group.name },
      })
      return { groupName: group.name, count }
    })
  )

  // 4. Pick from groups with minimum members
  const minCount = Math.min(...groupStats.map((g) => g.count))
  const candidateGroups = groupStats.filter((g) => g.count <= minCount + 1)
  const shuffled = shuffle(candidateGroups)

  return shuffled[0].groupName
}
