
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2]

    if (!email) {
        console.error("Please provide the email address of the user you want to promote.")
        console.log("Usage: npx tsx promote-to-super-admin.ts <email>")
        process.exit(1)
    }

    console.log(`Promoting user ${email} to SUPER_ADMIN...`)

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "SUPER_ADMIN" },
        })

        console.log("Success! User promoted to SUPER_ADMIN:")
        console.log(`Name: ${user.name}`)
        console.log(`Email: ${user.email}`)
        console.log(`Role: ${user.role}`)
    } catch (error) {
        console.error("Error promoting user. Make sure the user has signed up first.")
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
