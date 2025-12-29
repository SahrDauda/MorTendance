import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
} else {
  // In production, ensure we don't create multiple instances
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = db
  }
}

// Note: Connection will be established on first query
// We don't test it here to avoid blocking server startup

