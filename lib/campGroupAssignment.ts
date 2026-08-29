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
  { name: "Doxasmus", color: "#3B82F6" },
  { name: "Huiothesia", color: "#8B5CF6" },
  { name: "Dikaiosis", color: "#10B981" },
  { name: "Hagiasmos", color: "#F59E0B" },
  { name: "Paligenesia", color: "#EC4899" },
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
