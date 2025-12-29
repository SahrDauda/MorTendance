/**
 * Migration Script: Generate Embeddings for Existing Data
 * 
 * This script generates embeddings for all existing users, skills, opportunities, and projects
 * that don't have embeddings yet.
 * 
 * Usage:
 *   npx tsx scripts/generate-embeddings-for-existing-data.ts [--dry-run] [--batch-size=50]
 */

import { PrismaClient } from "@prisma/client"
import { updateEntityEmbedding, constructEntityText } from "../lib/ai/embeddings"

const prisma = new PrismaClient()

interface Options {
    dryRun: boolean
    batchSize: number
    resume: boolean
}

async function generateEmbeddingsForEntity(
    type: "user" | "skill" | "opportunity" | "project",
    entity: any,
    options: Options
): Promise<boolean> {
    try {
        if (options.dryRun) {
            const text = constructEntityText(type, entity)
            console.log(`[DRY RUN] Would generate embedding for ${type} ${entity.id}: ${text.substring(0, 100)}...`)
            return true
        }

        await updateEntityEmbedding(type, entity.id, entity)
        return true
    } catch (error: any) {
        console.error(`[ERROR] Failed to generate embedding for ${type} ${entity.id}:`, error.message)
        return false
    }
}

async function main() {
    const args = process.argv.slice(2)
    const options: Options = {
        dryRun: args.includes("--dry-run"),
        batchSize: parseInt(args.find((a) => a.startsWith("--batch-size="))?.split("=")[1] || "50", 10),
        resume: args.includes("--resume"),
    }

    console.log("🚀 Starting embedding generation...")
    console.log(`Options:`, options)

    let processed = 0
    let succeeded = 0
    let failed = 0

    // Process Users
    console.log("\n📊 Processing Users...")
    const userIdsWithoutEmbeddings = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM users WHERE embedding IS NULL LIMIT ${options.batchSize}
    `
    const users = await prisma.user.findMany({
        where: {
            id: { in: userIdsWithoutEmbeddings.map((u) => u.id) },
        },
        include: {
            learnerProfile: true,
            userSkills: {
                include: {
                    skill: true,
                },
            },
        },
    })

    for (const user of users) {
        processed++
        const success = await generateEmbeddingsForEntity(
            "user",
            {
                name: user.name,
                bio: user.learnerProfile?.bio,
                location: user.learnerProfile?.location,
                currentJobTitle: user.learnerProfile?.currentJobTitle,
                currentCompany: user.learnerProfile?.currentCompany,
                university: user.learnerProfile?.university,
                major: user.learnerProfile?.major,
                skills: user.userSkills.map((us) => ({ name: us.skill.name })),
            },
            options
        )
        if (success) succeeded++
        else failed++
    }

    // Process Skills
    console.log("\n📊 Processing Skills...")
    const skillIdsWithoutEmbeddings = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM skills WHERE embedding IS NULL LIMIT ${options.batchSize}
    `
    const skills = await prisma.skill.findMany({
        where: {
            id: { in: skillIdsWithoutEmbeddings.map((s) => s.id) },
        },
    })

    for (const skill of skills) {
        processed++
        const success = await generateEmbeddingsForEntity("skill", skill, options)
        if (success) succeeded++
        else failed++
    }

    // Process Opportunities
    console.log("\n📊 Processing Opportunities...")
    const opportunityIdsWithoutEmbeddings = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM opportunities WHERE embedding IS NULL LIMIT ${options.batchSize}
    `
    const opportunities = await prisma.opportunity.findMany({
        where: {
            id: { in: opportunityIdsWithoutEmbeddings.map((o) => o.id) },
        },
        include: {
            opportunitySkills: {
                include: {
                    skill: true,
                },
            },
        },
    })

    for (const opp of opportunities) {
        processed++
        const success = await generateEmbeddingsForEntity(
            "opportunity",
            {
                title: opp.title,
                company: opp.company,
                description: opp.description,
                location: opp.location,
                remote: opp.remote,
                type: opp.type,
                skills: opp.opportunitySkills.map((os) => ({ name: os.skill.name })),
            },
            options
        )
        if (success) succeeded++
        else failed++
    }

    // Process Projects
    console.log("\n📊 Processing Projects...")
    const projectIdsWithoutEmbeddings = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM projects WHERE embedding IS NULL LIMIT ${options.batchSize}
    `
    const projects = await prisma.project.findMany({
        where: {
            id: { in: projectIdsWithoutEmbeddings.map((p) => p.id) },
        },
        include: {
            projectSkills: {
                include: {
                    skill: true,
                },
            },
        },
    })

    for (const project of projects) {
        processed++
        const success = await generateEmbeddingsForEntity(
            "project",
            {
                title: project.title,
                description: project.description,
                skills: project.projectSkills.map((ps) => ({ name: ps.skill.name })),
            },
            options
        )
        if (success) succeeded++
        else failed++
    }

    console.log("\n✅ Migration complete!")
    console.log(`Processed: ${processed}`)
    console.log(`Succeeded: ${succeeded}`)
    console.log(`Failed: ${failed}`)

    if (options.dryRun) {
        console.log("\n⚠️  This was a dry run. Run without --dry-run to actually generate embeddings.")
    }
}

main()
    .catch((error) => {
        console.error("Fatal error:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

