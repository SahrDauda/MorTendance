const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const url = process.env.DATABASE_URL || 'NOT SET'
        console.log('DATABASE_URL (masked):', url.replace(/:[^:@]+@/, ':****@'))
        console.log('Attempting to connect to database...')
        const count = await prisma.user.count()
        console.log('Connection successful! User count:', count)
    } catch (e) {
        console.error('Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
