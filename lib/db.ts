import { PrismaClient as BasePrismaClient } from "@prisma/client"

export type PrismaClient = BasePrismaClient & {
  campMember: any
  campGroup: any
  campBranch: any
  campRoom: any
  campAttendance: any
  campSetting: any
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new BasePrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }) as PrismaClient
}

// In development, ensure we have a client with all latest models
const getPrisma = (): PrismaClient => {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient()
  }
  if (!globalForPrisma.prisma || !(globalForPrisma.prisma as any).campRoom) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const val = (client as any)[prop]
    if (typeof val === "function") {
      return val.bind(client)
    }
    return val
  },
})

export default db
