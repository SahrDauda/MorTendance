import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting database reset...')

    // Delete all attendance records first due to foreign key constraints
    const deletedRecords = await prisma.attendanceRecord.deleteMany({})
    console.log(`Deleted ${deletedRecords.count} attendance records.`)

    // Delete all attendance sessions
    const deletedSessions = await prisma.attendanceSession.deleteMany({})
    console.log(`Deleted ${deletedSessions.count} attendance sessions.`)

    // Delete all members
    const deletedMembers = await prisma.member.deleteMany({})
    console.log(`Deleted ${deletedMembers.count} members.`)

    console.log('Database reset complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
