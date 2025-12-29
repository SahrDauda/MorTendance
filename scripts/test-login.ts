import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
    console.log('Testing login credentials...\n')

    const email = 'marcos@mor.com'
    const password = 'minmarcos'

    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                passwordHash: true,
            },
        })

        if (!user) {
            console.log('❌ User not found:', email)
            return
        }

        console.log('✅ User found:')
        console.log('  ID:', user.id)
        console.log('  Email:', user.email)
        console.log('  Name:', user.name)
        console.log('  Role:', user.role)
        console.log('  Password Hash:', user.passwordHash.substring(0, 20) + '...')

        // Test password
        console.log('\nTesting password verification...')
        const isValid = await bcrypt.compare(password, user.passwordHash)
        
        if (isValid) {
            console.log('✅ Password is valid!')
        } else {
            console.log('❌ Password is invalid!')
            console.log('  Expected hash:', user.passwordHash)
            
            // Try to create a new hash to see if it matches
            const testHash = await bcrypt.hash(password, 10)
            console.log('  New hash for comparison:', testHash)
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testLogin()

