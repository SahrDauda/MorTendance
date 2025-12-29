# Blockchain Verification with Solana — Explicit Implementation Guide

**Audience:** Developers implementing verifiable credentials using Solana blockchain.
**Goal:** Anchor credentials on Solana for tamper-proof verification and provide a trusted verification UI.
**Primary Technology:** Solana (using `@solana/web3.js` for transactions, devnet for testing, mainnet for production)

---

## 🎯 Technology Stack (Explicit)

**Blockchain:** Solana
- **Network:** Devnet for testing (`https://api.devnet.solana.com`), Mainnet for production (`https://api.mainnet-beta.solana.com`)
- **Transaction Method:** Solana Memo Program (store hash as memo in transaction)
- **SDK:** `@solana/web3.js` - Official Solana JavaScript SDK
- **Key Encoding:** Base58 (using `bs58` package)
- **Why Solana:** Low transaction costs (~$0.00001 SOL per transaction), fast confirmation (~400ms), reliable RPC infrastructure

**Required Packages:**
- `@solana/web3.js` - Solana Web3.js library for blockchain interactions
- `bs58` - Base58 encoding/decoding for private keys and addresses

**Transaction Cost:** ~0.00001 SOL per credential anchor (extremely low cost)

---

## 📋 MVP Feature Checklist
1.  **Anchoring:** Hash credential data and store it on Solana blockchain using Memo Program.
2.  **Verification:** Scan QR -> Check on-chain hash via Solana RPC -> Confirm validity.
3.  **Revocation:** Issuer can revoke a credential (mandatory) - update DB status.
4.  **Issuer Identity:** Show *who* issued the credential (not just a wallet address) via issuer registry.

---

## 🛠️ Phase 1: Setup & Data Model

### Step 1.1: Dependencies & Environment
1.  **Install Packages:**
    *   Run `npm install @solana/web3.js bs58`
2.  **Environment Variables:**
    *   `SOLANA_RPC_URL`: Use `https://api.devnet.solana.com` for dev/staging.
    *   `SOLANA_PRIVATE_KEY`: Base58 encoded private key of the issuer wallet.
    *   `SOLANA_CLUSTER`: `devnet` or `mainnet-beta`.
    *   **Validation:** Add startup check in `lib/blockchain/config.ts` to validate all env vars exist, fail fast with clear error messages.
3.  **Wallet Funding & Monitoring:**
    *   Ensure the issuer wallet has SOL (minimum 0.1 SOL recommended).
    *   **Balance Check:** Create `lib/blockchain/wallet-monitor.ts`:
        *   Function `checkWalletBalance()`: Query balance via RPC, return balance in SOL.
        *   Function `ensureMinimumBalance(minSol: number)`: Throws error if balance < minSol.
    *   **Alerting:** Create script `scripts/check-solana-balance.ts`:
        *   Check balance on startup and before each anchor operation.
        *   Log warning if < 0.1 SOL, error if < 0.01 SOL.
        *   (Future: Integrate with monitoring service for alerts)
4.  **Security:**
    *   Never commit `SOLANA_PRIVATE_KEY` to git.
    *   Use environment-specific secrets management (Vercel Secrets, AWS Secrets Manager, etc.).
    *   Consider key rotation strategy for production.

### Step 1.2: Database Schema
1.  **Update `Credential` Model in `prisma/schema.prisma`:**
    *   Add `blockchainHash` (String?): The SHA-256 hash of the credential.
    *   Add `blockchainTxId` (String?): The Solana transaction signature.
    *   Add `blockchainStatus` (String?): Values: `pending`, `anchored`, `failed`, `revoked`.
    *   Add `blockchainChain` (String?): e.g., `solana-devnet`.
2.  **Apply Changes:**
    *   Run `npx prisma generate` and `npx prisma db push`.

---

## 🔐 Phase 2: Hashing & Anchoring

### Step 2.1: Deterministic Hashing
1.  **Create `lib/blockchain/hash.ts`:**
    *   **Goal:** Create a consistent hash regardless of field order.
    *   **Logic:**
        *   Extract specific fields: `id`, `issuer`, `issueDate`, `expiryDate`, `skills` (sort this array!), `userId`.
        *   Create a canonical JSON string (keys sorted alphabetically).
        *   Hash using SHA-256.
        *   Return the hex string.

### Step 2.2: Anchoring Service (Solana)
1.  **Create `lib/blockchain/solana.ts`:**
    ```typescript
    import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js'
    import { createMemoInstruction } from '@solana/web3.js'
    import bs58 from 'bs58'
    import { LAMPORTS_PER_SOL } from '@solana/web3.js'
    
    // Get Solana connection
    function getSolanaConnection(): Connection {
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      return new Connection(rpcUrl, 'confirmed')
    }
    
    // Load keypair from environment
    function getIssuerKeypair(): Keypair {
      const privateKey = process.env.SOLANA_PRIVATE_KEY
      if (!privateKey) {
        throw new Error('SOLANA_PRIVATE_KEY is required')
      }
      const secretKey = bs58.decode(privateKey)
      return Keypair.fromSecretKey(secretKey)
    }
    
    // Anchor hash on Solana blockchain
    export async function anchorHash(hash: string): Promise<{ signature: string, explorerUrl: string }> {
      // Pre-flight checks
      if (!/^[a-f0-9]{64}$/i.test(hash)) {
        throw new Error('Invalid hash format: must be 64-char hex string')
      }
      
      const connection = getSolanaConnection()
      const keypair = getIssuerKeypair()
      
      // Check wallet balance
      const balance = await connection.getBalance(keypair.publicKey)
      const minBalance = 0.01 * LAMPORTS_PER_SOL // 0.01 SOL minimum
      if (balance < minBalance) {
        throw new Error(`Insufficient SOL balance: ${balance / LAMPORTS_PER_SOL} SOL (minimum: 0.01 SOL)`)
      }
      
      // Create transaction with Memo Program
      const transaction = new Transaction()
      
      // Add memo instruction (stores the hash)
      const memoInstruction = createMemoInstruction(
        Buffer.from(`CREDENTIAL_HASH:${hash}`, 'utf-8'),
        [keypair.publicKey]
      )
      transaction.add(memoInstruction)
      
      // Add minimal transfer to ensure transaction is processed (0.00001 SOL to self)
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: 10000, // 0.00001 SOL
      })
      transaction.add(transferInstruction)
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = keypair.publicKey
      
      // Sign and send transaction with retry logic
      let signature: string
      let retries = 3
      let lastError: Error | null = null
      
      while (retries > 0) {
        try {
          signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
            {
              commitment: 'confirmed',
              maxRetries: 0, // We handle retries ourselves
            }
          )
          break // Success
        } catch (error: any) {
          lastError = error
          // Retry on network errors, not on transaction errors
          if (error.message?.includes('network') || error.message?.includes('timeout')) {
            retries--
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))) // Exponential backoff
              continue
            }
          }
          // Don't retry on transaction errors (insufficient funds, invalid signature, etc.)
          throw error
        }
      }
      
      if (!signature!) {
        throw lastError || new Error('Failed to anchor hash after retries')
      }
      
      // Build explorer URL
      const cluster = process.env.SOLANA_CLUSTER || 'devnet'
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
      
      return { signature, explorerUrl }
    }
    
    // Estimate cost
    export function estimateAnchorCost(): number {
      return 0.00001 // ~0.00001 SOL per transaction
    }
    ```
    *   **Key Solana Concepts:**
        *   **Connection:** Connects to Solana RPC endpoint (devnet or mainnet)
        *   **Keypair:** Wallet with public/private key (loaded from env var)
        *   **Transaction:** Contains instructions (memo + transfer)
        *   **Memo Program:** Built-in Solana program to store text data (our hash)
        *   **Blockhash:** Recent block identifier required for transaction
        *   **Signature:** Transaction ID returned after successful submission
    *   **Error handling:**
        *   `RpcError` (rate limits, network issues) → retry with backoff
        *   `TransactionError` (insufficient funds, invalid signature) → fail immediately
        *   All errors logged with correlation ID

### Step 2.3: Integrate with Issuance Flow
1.  **Issuer Authorization:**
    *   **Check:** Only users with role `INSTITUTION` can issue credentials.
    *   Add middleware `requireIssuerRole()` in credential creation endpoint.
    *   Validate issuer wallet matches authorized wallet from issuer registry.
2.  **Update Credential Creation API (`app/api/credentials/route.ts`):**
    *   **Synchronous path (MVP):**
        *   When credential is created/approved:
            1.  Calculate hash using `hashCredential()`.
            2.  Try to call `anchorHash()` (with retry logic).
            3.  If successful: Update DB with `blockchainHash`, `blockchainTxId`, `blockchainChain`, `blockchainStatus='anchored'`.
            4.  If failed: Save credential anyway, mark `blockchainStatus='failed'`, log error with correlation ID.
    *   **Asynchronous path (recommended for production):**
        *   Save credential immediately with `blockchainStatus='pending'`.
        *   Enqueue background job to anchor hash (see Step 2.4).
        *   Return 201 immediately, job will update status when complete.
3.  **Error Handling:**
    *   Never block credential creation if anchoring fails.
    *   Log all errors with structured logging (JSON format).
    *   Include correlation ID in logs for request tracing.
    *   Return user-friendly error messages (don't expose internal errors).

### Step 2.4: Background Job Queue (Recommended)
1.  **Job Queue Setup:**
    *   Install job queue library: `npm install bullmq` or use Vercel Cron + API route.
    *   Create `lib/blockchain/anchor-queue.ts`:
        *   Queue name: `credential-anchor`.
        *   Job payload: `{ credentialId: string, hash: string }`.
        *   Retry: Up to 3 attempts with exponential backoff.
        *   On success: Update credential with `blockchainTxId` and `status='anchored'`.
        *   On failure: Update `status='failed'`, log error.
2.  **Worker Process:**
    *   Create `workers/anchor-worker.ts` (or use API route with cron):
        *   Process jobs from queue.
        *   Call `anchorHash()` for each job.
        *   Update database on completion.
3.  **Retry Failed Anchors:**
    *   Create endpoint `POST /api/credentials/[id]/retry-anchor`:
        *   Admin-only endpoint.
        *   Recompute hash and re-attempt anchoring.
        *   Update status accordingly.

---

## ✅ Phase 3: Verification & Trust

### Step 3.1: Verification Logic
1.  **Create `app/api/credentials/[id]/blockchain/route.ts` (Private endpoint):**
    *   **Inputs:** Credential ID.
    *   **Steps:**
        1.  Fetch Credential from DB.
        2.  If no `blockchainHash` or `blockchainTxId`, return `verified: false, reason: "not_anchored"`.
        3.  **Explicit Solana Verification Code:**
        ```typescript
        import { Connection } from '@solana/web3.js'
        import { getSolanaConnection } from '@/lib/blockchain/solana'
        
        const connection = getSolanaConnection()
        
        // Fetch transaction from Solana RPC
        const transaction = await connection.getTransaction(blockchainTxId, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        })
        
        if (!transaction) {
          return { verified: false, reason: 'transaction_not_found' }
        }
        
        // Extract memo instruction (contains our hash)
        const memoProgramId = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
        const memoInstruction = transaction.transaction.message.instructions.find(
          (ix: any) => ix.programId.toString() === memoProgramId
        )
        
        if (!memoInstruction) {
          return { verified: false, reason: 'no_memo_found' }
        }
        
        // Parse memo data (format: "CREDENTIAL_HASH:<hash>")
        const memoData = Buffer.from(memoInstruction.data, 'base64').toString('utf-8')
        const onChainHash = memoData.replace('CREDENTIAL_HASH:', '')
        ```
        4.  **Error handling:**
            *   If transaction not found: Return `verified: false, reason: "transaction_not_found"`
            *   If RPC error: Retry once, then return `verified: false, reason: "rpc_error"`
        5.  **Compare:** Does DB Hash (`blockchainHash`) == On-Chain Hash (`onChainHash`)?
        6.  **Revocation Check:** Is `blockchainStatus` == `revoked`? (Check DB first, fastest)
        7.  **Issuer Check:** Does the transaction signer match a known Issuer Wallet?
            ```typescript
            // Get transaction signer (first account in transaction)
            const signer = transaction.transaction.message.accountKeys[0].pubkey.toString()
            
            // Check against issuer registry
            const issuer = getIssuerByWallet(signer)
            if (!issuer) {
              return { verified: false, reason: 'unknown_issuer' }
            }
            ```
    *   **Return:** `{ verified: boolean, reason?: string, issuer?: { name, logo }, chainData: { txId, explorerUrl, chain }, timestamp: Date }`
    *   **Caching:** Cache verification result for 5 minutes (Redis or in-memory) to reduce RPC calls.

### Step 3.1b: Public Verification Endpoint
1.  **Update `app/api/credentials/[id]/verify/route.ts` (Make it public):**
    *   **Remove auth requirement** (or make it optional).
    *   Call blockchain verification internally.
    *   Return public-friendly response:
        *   `{ credential: {...}, verification: { verified, status, issuer, explorerUrl } }`
    *   **Rate limiting:** Add rate limiting (e.g., 10 requests/minute per IP) to prevent abuse.
    *   **CORS:** Allow public access, but validate input to prevent injection.

### Step 3.2: Issuer Registry (MVP)
1.  **Simple Implementation:**
    *   Create a constant file `lib/blockchain/issuers.ts`.
    *   Export a map: `Record<WalletAddress, { name: string, logo: string }>`.
    *   *Why:* This prevents anyone from just anchoring a fake hash from their own wallet. The UI will only show "Verified by University X" if the wallet matches.

### Step 3.3: Revocation
1.  **Revoke Endpoint:**
    *   Admin clicks "Revoke".
    *   Update DB `blockchainStatus` = `revoked`.
    *   (Optional for MVP, but good): Anchor a new transaction with "REVOKED:<hash>".
    *   The Verification endpoint must check the DB status first.

---

## 📱 Phase 4: UI Integration

### Step 4.1: Public Verification Page
1.  **Page `/verify/[id]`:**
    *   Call the verification endpoint on load.
    *   **States:**
        *   ✅ **Verified:** Green badge, "Issued by [Institution Name]", link to Solana Explorer.
        *   ❌ **Invalid:** Hash mismatch or revoked. Show warning.
        *   ⏳ **Pending:** Not yet anchored.

### Step 4.2: QR Code
1.  **Generate QR:**
    *   The QR code should point to `https://platform.com/verify/[credential_id]`.
    *   This ensures the verifier lands on *your* trusted domain to see the verification status.
    *   Update existing `app/api/credentials/[id]/qr/route.ts` to use the public verification URL.

---

## 🔄 Phase 5: Migration & Operations

### Step 5.1: Migration Strategy for Existing Credentials
1.  **Migration Script (`scripts/migrate-credentials-to-blockchain.ts`):**
    *   Find all credentials without `blockchainHash`.
    *   For each credential:
        1.  Compute hash using `hashCredential()`.
        2.  Attempt to anchor on Solana (with retry logic).
        3.  Update database with hash and transaction ID.
        4.  Log progress (success/failure per credential).
    *   **Batch processing:** Process 10 credentials at a time to avoid rate limits.
    *   **Resume capability:** Track processed credentials, allow script to resume from last checkpoint.
    *   **Dry run mode:** Add `--dry-run` flag to test without anchoring.

### Step 5.2: Cost Tracking & Monitoring
1.  **Cost Estimation:**
    *   Track SOL spent per credential (log in database or separate table).
    *   Function `getAnchoringCosts(startDate, endDate)` to calculate total costs.
2.  **Monitoring:**
    *   Log all anchor operations with: timestamp, credential ID, cost, success/failure.
    *   Create dashboard/metrics endpoint to show:
        *   Total credentials anchored.
        *   Success/failure rates.
        *   Average cost per credential.
        *   Daily/monthly costs.

### Step 5.3: Environment Variable Validation
1.  **Startup Validation (`lib/blockchain/config.ts`):**
    *   Function `validateSolanaConfig()`:
        *   Check all required env vars exist.
        *   Validate `SOLANA_PRIVATE_KEY` is valid base58.
        *   Validate `SOLANA_CLUSTER` is valid value.
        *   Test RPC connection on startup (optional, but recommended).
        *   Throw clear error messages if validation fails.

### Step 5.4: Testing Strategy
1.  **Unit Tests:**
    *   Mock `@solana/web3.js` Connection for testing.
    *   Test hash generation determinism.
    *   Test error handling (network errors, insufficient funds, etc.).
2.  **Integration Tests:**
    *   Use Solana devnet for real transaction testing.
    *   Test full flow: create credential → anchor → verify.
    *   Test retry logic with simulated failures.
3.  **E2E Tests:**
    *   Issue credential on devnet.
    *   Scan QR code.
    *   Verify on public verification page.
    *   Confirm Solana Explorer link works.

---

## 📚 Documentation Requirements
1.  **API Documentation:**
    *   Document all new endpoints (`/blockchain`, `/retry-anchor`, etc.).
    *   Include request/response examples.
    *   Document error codes and meanings.
2.  **Environment Setup:**
    *   Update `.env.example` with all new variables.
    *   Document how to get Solana devnet SOL (faucet).
    *   Document wallet creation and funding process.
3.  **Troubleshooting Guide:**
    *   Common errors and solutions:
        *   "Insufficient funds" → How to add SOL.
        *   "Transaction not found" → Network issues, how to retry.
        *   "RPC rate limit" → Wait and retry.

