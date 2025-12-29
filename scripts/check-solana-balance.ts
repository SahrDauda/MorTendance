/**
 * Solana Wallet Balance Checker
 * Checks wallet balance and provides warnings/alerts
 * 
 * Usage:
 *   npx tsx scripts/check-solana-balance.ts
 */

import { getWalletStatus } from "../lib/blockchain/wallet-monitor"

async function main() {
    try {
        console.log("🔍 Checking Solana wallet balance...\n")

        const status = await getWalletStatus()

        console.log(`Balance: ${status.balance.toFixed(6)} SOL`)
        console.log(`Status: ${status.status.toUpperCase()}`)
        console.log(`Message: ${status.message}\n`)

        if (status.status === "critical") {
            console.error("❌ CRITICAL: Wallet balance is too low. Transactions will fail.")
            console.error("   Please fund your wallet immediately.")
            console.error("   Devnet faucet: https://faucet.solana.com")
            process.exit(1)
        } else if (status.status === "low") {
            console.warn("⚠️  WARNING: Wallet balance is low. Consider adding more SOL.")
            process.exit(0)
        } else {
            console.log("✅ Wallet balance is healthy.")
            process.exit(0)
        }
    } catch (error: any) {
        console.error("❌ Error checking wallet balance:", error.message)
        process.exit(1)
    }
}

main()

