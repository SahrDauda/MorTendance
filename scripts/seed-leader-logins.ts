import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("--- SEEDING / SYNCING GROUP HEAD & SUPERVISOR LOGINS ---")
  const defaultPasswordHash = await bcrypt.hash("123456", 10)

  // 1. Fetch all leaders, supervisors, head shepherds, and members with leadership roles
  const leadershipMembers = await prisma.campMember.findMany({
    where: {
      OR: [
        { position: { not: "General Member" } },
        { position: { equals: "Leader", mode: "insensitive" } },
        { position: { equals: "Supervisor", mode: "insensitive" } },
        { position: { equals: "Head Shepherd", mode: "insensitive" } },
        { position: { equals: "Coordinator", mode: "insensitive" } },
      ],
    },
  })

  console.log(`Found ${leadershipMembers.length} leadership members in camp roster.`)

  let createdCount = 0
  let updatedCount = 0

  for (const m of leadershipMembers) {
    const fullName = m.fullName.trim()
    const cleanEmail =
      fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".") + "@morcamp.org"

    // Check if user exists with this name or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: fullName, mode: "insensitive" } },
          { email: { equals: cleanEmail, mode: "insensitive" } },
        ],
      },
    })

    if (existingUser) {
      // Update password to 123456 and role to SENIOR_LEADER if needed
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: fullName,
          passwordHash: defaultPasswordHash,
          role: existingUser.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SENIOR_LEADER",
        },
      })
      updatedCount++
      console.log(`Updated credentials for: "${fullName}" (Username: "${fullName}", Password: "123456")`)
    } else {
      await prisma.user.create({
        data: {
          name: fullName,
          email: cleanEmail,
          passwordHash: defaultPasswordHash,
          role: "SENIOR_LEADER",
          passwordUpdated: false,
        },
      })
      createdCount++
      console.log(`Created user account for: "${fullName}" (Username: "${fullName}", Email: "${cleanEmail}", Password: "123456")`)
    }
  }

  console.log(`\n🎉 Completed: ${createdCount} created, ${updatedCount} updated.`)
}

main()
  .catch((e) => {
    console.error("Error seeding leader logins:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
