
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const email = "emmanuelsahrdauda.dev@gmail.com"
    console.log(`Checking if user ${email} exists locally...`)

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (user) {
            console.log("User found!")
            console.log("ID:", user.id)
            console.log("Role:", user.role)
            console.log("Has password hash:", !!user.passwordHash)
        } else {
            console.log("User NOT found in the current database.")
        }
    } catch (error) {
        console.error("Error checking user:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
