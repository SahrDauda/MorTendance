
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const email = "emmanuelsahrdauda.dev@gmail.com"
    const password = "dauda2019"

    console.log(`Ensuring user ${email} exists with SUPER_ADMIN role and correct password...`)

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: "SUPER_ADMIN",
                passwordHash: hashedPassword,
            },
            create: {
                email,
                name: "Emmanuel Sahr Dauda",
                passwordHash: hashedPassword,
                role: "SUPER_ADMIN",
            },
        })

        console.log("Success! User is now ready:")
        console.log("Email:", user.email)
        console.log("Role:", user.role)
        console.log("\nYou can now log in with the password you provided.")
    } catch (error) {
        console.error("Error creating/updating user:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
