import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuthFlow() {
    console.log('Testing authentication flow...\n')

    const email = 'marcos@mor.com'
    const password = 'minmarcos'

    try {
        // Step 1: Find user
        console.log('Step 1: Finding user...')
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
            console.log('❌ User not found')
            return
        }
        console.log('✅ User found:', user.email, user.role)

        // Step 2: Verify password
        console.log('\nStep 2: Verifying password...')
        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
            console.log('❌ Password invalid')
            return
        }
        console.log('✅ Password valid')

        // Step 3: Check user object structure
        console.log('\nStep 3: User object structure:')
        const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }
        console.log(JSON.stringify(userObject, null, 2))

        console.log('\n✅ All checks passed! Authentication should work.')
        console.log('\nIf sign-in still fails, check:')
        console.log('1. Server console logs for [Auth] messages')
        console.log('2. Browser console for sign-in result')
        console.log('3. Network tab for API call to /api/auth/callback/credentials')
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testAuthFlow()

