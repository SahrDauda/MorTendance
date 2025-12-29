/**
 * Migration Script: Anchor Existing Credentials on Solana
 * 
 * This script anchors all existing credentials that don't have blockchain hashes
 * 
 * Usage:
 *   npx tsx scripts/migrate-credentials-to-blockchain.ts [--dry-run] [--batch-size=10]
 */

import { PrismaClient } from "@prisma/client"
import { hashCredential } from "../lib/blockchain/hash"
import { anchorHash } from "../lib/blockchain/solana"
import { getSolanaConfig } from "../lib/blockchain/config"

const prisma = new PrismaClient()

interface Options {
    dryRun: boolean
    batchSize: number
}

async function anchorCredential(credential: any, options: Options): Promise<boolean> {
    try {
        // Compute hash
        const hash = hashCredential({
            id: credential.id,
            userId: credential.userId,
            issuer: credential.issuer,
            title: credential.title,
            type: credential.type,
            issueDate: credential.issueDate,
            expiryDate: credential.expiryDate,
            skills: credential.credentialSkills.map((cs: any) => cs.skill.id),
            createdAt: credential.createdAt,
        })

        if (options.dryRun) {
            console.log(`[DRY RUN] Would anchor credential ${credential.id}: ${hash.substring(0, 16)}...`)
            return true
        }

        // Anchor on Solana
        const { signature, explorerUrl } = await anchorHash(hash)
        const config = getSolanaConfig()

        // Update database
        await prisma.credential.update({
            where: { id: credential.id },
            data: {
                blockchainHash: hash,
                ...({
                    blockchainTxId: signature,
                    blockchainStatus: "anchored",
                    blockchainChain: `solana-${config.cluster}`,
                } as any),
            },
        })

        console.log(`✅ Anchored credential ${credential.id}: ${explorerUrl}`)
        return true
    } catch (error: any) {
        console.error(`❌ Failed to anchor credential ${credential.id}:`, error.message)

        // Update status to failed
        if (!options.dryRun) {
            try {
                await prisma.credential.update({
                    where: { id: credential.id },
                    data: {
                        ...({ blockchainStatus: "failed" } as any),
                    },
                })
            } catch (updateError) {
                console.error(`Failed to update status for ${credential.id}:`, updateError)
            }
        }

        return false
    }
}

async function main() {
    const args = process.argv.slice(2)
    const options: Options = {
        dryRun: args.includes("--dry-run"),
        batchSize: parseInt(args.find((a) => a.startsWith("--batch-size="))?.split("=")[1] || "10", 10),
    }

    console.log("🚀 Starting credential migration to blockchain...")
    console.log(`Options:`, options)

    // Find credentials without blockchain hash
    const credentialsWithoutHash = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM credentials WHERE blockchain_hash IS NULL LIMIT ${options.batchSize}
  `

    if (credentialsWithoutHash.length === 0) {
        console.log("✅ No credentials to migrate")
        return
    }

    console.log(`\n📊 Found ${credentialsWithoutHash.length} credentials to migrate`)

    let processed = 0
    let succeeded = 0
    let failed = 0

    for (const { id } of credentialsWithoutHash) {
        processed++

        // Fetch full credential with relations
        const credential = await prisma.credential.findUnique({
            where: { id },
            include: {
                credentialSkills: {
                    include: {
                        skill: true,
                    },
                },
            },
        })

        if (!credential) {
            console.warn(`⚠️  Credential ${id} not found, skipping`)
            continue
        }

        const success = await anchorCredential(credential, options)

        if (success) {
            succeeded++
        } else {
            failed++
        }

        // Small delay to avoid rate limits
        if (!options.dryRun && processed < credentialsWithoutHash.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay
        }
    }

    console.log("\n✅ Migration complete!")
    console.log(`Processed: ${processed}`)
    console.log(`Succeeded: ${succeeded}`)
    console.log(`Failed: ${failed}`)

    if (options.dryRun) {
        console.log("\n⚠️  This was a dry run. Run without --dry-run to actually anchor credentials.")
    } else if (failed > 0) {
        console.log("\n💡 Tip: Run the script again to retry failed credentials.")
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

