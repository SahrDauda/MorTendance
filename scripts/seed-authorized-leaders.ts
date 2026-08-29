import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// The authorized accounts:
// 1. Super Admin
// 2. Head Shepherds (Marcus D. Williams, Sylvester Sesay)
// 3. 5 Group Heads (Judah Tarawally, Emmanuel Gbembo, Elizabeth Duncan, Lovicious Marvelous, Prince Lewis)
const AUTHORIZED_LEADERS = [
  {
    name: "Judah Tarawally",
    email: "judah.tarawally@mor.org",
    role: "SENIOR_LEADER",
    group: "Dikaiosis",
    title: "Dikaiosis Group Head",
  },
  {
    name: "Emmanuel Gbembo",
    email: "emmanuel.gbembo@mor.org",
    role: "SENIOR_LEADER",
    group: "Doxasmus",
    title: "Doxasmus Group Head",
  },
  {
    name: "Elizabeth Duncan",
    email: "elizabeth.duncan@mor.org",
    role: "SENIOR_LEADER",
    group: "Hagiasmos",
    title: "Hagiasmos Group Head",
  },
  {
    name: "Lovicious Marvelous",
    email: "lovicious.marvelous@mor.org",
    role: "SENIOR_LEADER",
    group: "Huiothesia",
    title: "Huiothesia Group Head",
  },
  {
    name: "Prince Lewis",
    email: "prince.lewis@mor.org",
    role: "SENIOR_LEADER",
    group: "Paligenesia",
    title: "Paligenesia Group Head",
  },
  {
    name: "Marcus D. Williams",
    email: "marcus.williams@mor.org",
    role: "SUPER_ADMIN",
    group: null,
    title: "Head Shepherd",
  },
  {
    name: "Sylvester Sesay",
    email: "sylvester.sesay@mor.org",
    role: "SUPER_ADMIN",
    group: null,
    title: "Supervisor & Head Shepherd",
  },
  {
    name: "MOR Administrator",
    email: "admin@mor.org",
    role: "SUPER_ADMIN",
    group: null,
    title: "System Administrator",
  },
]

async function main() {
  console.log("Seeding authorized accounts for 5 Group Heads, Head Shepherds, and Admin...")

  const defaultHash = await bcrypt.hash("123456", 10)

  for (const leader of AUTHORIZED_LEADERS) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: leader.name, mode: "insensitive" } },
          { email: { equals: leader.email, mode: "insensitive" } },
        ],
      },
    })

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: leader.name,
          email: leader.email,
          role: leader.role as any,
          passwordHash: defaultHash,
        },
      })
      console.log(`✅ Updated account: ${leader.name} (${leader.title}) - Login: "${leader.name}" | Password: "123456"`)
    } else {
      await prisma.user.create({
        data: {
          name: leader.name,
          email: leader.email,
          role: leader.role as any,
          passwordHash: defaultHash,
        },
      })
      console.log(`✨ Created account: ${leader.name} (${leader.title}) - Login: "${leader.name}" | Password: "123456"`)
    }
  }

  console.log("All authorized leader credentials successfully provisioned.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
