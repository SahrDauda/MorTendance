const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('DATABASE_URL:', process.env.DATABASE_URL)
        console.log('DIRECT_URL:', process.env.DIRECT_URL)
        console.log('Attempting to query MinistryGroup...')
        const groups = await prisma.ministryGroup.findMany({
            take: 1,
            select: {
                id: true,
                name: true,
                branchId: true
            }
        })
        console.log('Query successful! Sample group:', groups[0])
    } catch (e) {
        console.error('Query failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
