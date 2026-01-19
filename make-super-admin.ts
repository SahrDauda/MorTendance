
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2]

    if (!email) {
        console.error("Please provide an email address as an argument.")
        console.log("Usage: npx tsx make-super-admin.ts <email>")
        process.exit(1)
    }

    console.log(`Updating user ${email} to SUPER_ADMIN...`)

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "SUPER_ADMIN" },
        })

        console.log("Success! User updated:")
        console.log(user)
    } catch (error) {
        console.error("Error updating user:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
