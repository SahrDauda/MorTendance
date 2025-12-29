import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting user creation...')

    // 1. Delete all existing ADMIN users
    console.log('Deleting existing ADMIN users...')
    const deletedAdmins = await prisma.user.deleteMany({
        where: { role: UserRole.ADMIN }
    })
    console.log(`Deleted ${deletedAdmins.count} admin user(s)`)

    // 2. Create Admin User
    console.log('Creating admin user...')
    const adminPasswordHash = await bcrypt.hash('minmarcos', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'marcos@mor.com' },
        update: {
            name: 'Marcos',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
        },
        create: {
            email: 'marcos@mor.com',
            name: 'Marcos',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
        },
    })
    console.log('✅ Created Admin:', admin.email, '| Role:', admin.role)

    // 3. Create Leader User
    console.log('Creating leader user...')
    const leaderPasswordHash = await bcrypt.hash('minzion', 10)
    const leader = await prisma.user.upsert({
        where: { email: 'zion@mor.com' },
        update: {
            name: 'Zion',
            passwordHash: leaderPasswordHash,
            role: UserRole.LEADER,
        },
        create: {
            email: 'zion@mor.com',
            name: 'Zion',
            passwordHash: leaderPasswordHash,
            role: UserRole.LEADER,
        },
    })
    console.log('✅ Created Leader:', leader.email, '| Role:', leader.role)

    console.log('\n✅ User creation completed!')
    console.log('\nLogin credentials:')
    console.log('Admin: marcos@mor.com / minmarcos')
    console.log('Leader: zion@mor.com / minzion')
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

