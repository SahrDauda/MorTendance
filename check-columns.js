const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Checking columns for attendance_sessions...')
        const result = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'attendance_sessions'
        `
        console.log('Columns found:', result.map(r => r.column_name).join(', '))

        const hasCutoffTime = result.some(r => r.column_name === 'cutoff_time')
        console.log('Has cutoff_time column:', hasCutoffTime)
    } catch (e) {
        console.error('Query failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
