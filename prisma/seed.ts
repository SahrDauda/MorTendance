import { PrismaClient, UserRole, MemberStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    /*
    // 1. Create Branches
    const branchNames = ['Headquarters', 'Eastern', 'Bo']
    const branches = []

    for (const name of branchNames) {
        const branch = await prisma.branch.upsert({
            where: { name },
            update: {},
            create: { name },
        })
        branches.push(branch)
        console.log('Created Branch:', branch.name)
    }
    */

    // 2. Create Admin User (The ONLY initial user)
    const adminPasswordHash = await bcrypt.hash('minmarcos', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'minmarcos@mor.org' },
        update: {},
        create: {
            email: 'minmarcos@mor.org',
            name: 'Min Marcos',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
            // managedBranch: {
            //     connect: { name: 'Headquarters' }
            // }
        },
    })
    console.log('Created Super Admin:', admin.email)

    /*
    // 3. Create Groups
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

    // 4. Create Leaders for each group (Assigned to HQ for now)
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
                },
                // Optional: Assign leader to a branch? 
                // For now, let's say they are in HQ
            },
        })
        console.log(`Created Leader for ${group.name}:`, leader.email)
    }

    // 5. Create some initial members for testing
    // Distribute them across branches
    for (const group of groups) {
        for (let i = 1; i <= 5; i++) {
            const randomBranch = branches[Math.floor(Math.random() * branches.length)]
            await prisma.member.create({
                data: {
                    name: `Member ${i} of ${group.name}`,
                    groupId: group.id,
                    branchId: randomBranch.id,
                    status: i % 3 === 0 ? MemberStatus.ESTABLISHED : (i % 2 === 0 ? MemberStatus.SEMI_CONSISTENT : MemberStatus.PRELIMINARY),
                    gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
                    address: '123 Ministry Lane',
                }
            })
        }
        console.log(`Created 5 members for ${group.name}`)
    }
    */

    console.log('Seeding finished. Only Admin created.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
