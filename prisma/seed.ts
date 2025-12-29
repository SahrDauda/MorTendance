import { PrismaClient, UserRole, MemberStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@mor.org' },
        update: {},
        create: {
            email: 'admin@mor.org',
            name: 'MOR Admin',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
        },
    })
    console.log('Created Admin:', admin.email)

    // 2. Create Groups
    const groupNames = ['Huiothesia', 'Doxasmus', 'Paligenasia']
    const groups = []

    for (const name of groupNames) {
        const group = await prisma.ministryGroup.upsert({
            where: { name },
            update: {},
            create: { name },
        })
        groups.push(group)
        console.log('Created Group:', group.name)
    }

    // 3. Create Leaders for each group
    const leaderPasswordHash = await bcrypt.hash('leader123', 10)
    for (const group of groups) {
        const leaderEmail = `leader.${group.name.toLowerCase()}@mor.org`
        const leader = await prisma.user.upsert({
            where: { email: leaderEmail },
            update: {},
            create: {
                email: leaderEmail,
                name: `${group.name} Leader`,
                passwordHash: leaderPasswordHash,
                role: UserRole.LEADER,
                managedGroups: {
                    connect: { id: group.id }
                }
            },
        })
        console.log(`Created Leader for ${group.name}:`, leader.email)
    }

    // 4. Create some initial members for testing
    for (const group of groups) {
        for (let i = 1; i <= 5; i++) {
            await prisma.member.create({
                data: {
                    name: `Member ${i} of ${group.name}`,
                    groupId: group.id,
                    status: i % 3 === 0 ? MemberStatus.ESTABLISHED : (i % 2 === 0 ? MemberStatus.SEMI_CONSISTENT : MemberStatus.PRELIMINARY),
                }
            })
        }
        console.log(`Created 5 members for ${group.name}`)
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
