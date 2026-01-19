
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const email = "emmanuelsahrdauda.dev@gmail.com"
    console.log(`Deleting user ${email} to start fresh...`)

    try {
        await prisma.user.delete({
            where: { email },
        })
        console.log("Success! User deleted.")
    } catch (error) {
        console.log("User not found or already deleted.")
    } finally {
        await prisma.$disconnect()
    }
}

main()
