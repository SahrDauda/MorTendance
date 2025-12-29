# AI Integration with OpenAI — Explicit Implementation Guide

**Audience:** Developers implementing AI features using OpenAI APIs.
**Goal:** Add Resume Parsing, Semantic Search, and Match Explanations to the Bridge Platform using OpenAI.
**Primary Technology:** OpenAI (embeddings: `text-embedding-3-small`, LLM: `gpt-4o-mini` for cost-effective, `gpt-4o` for complex tasks)

---

## 🎯 Technology Stack (Explicit)

**AI Provider:** OpenAI
- **Embeddings Model:** `text-embedding-3-small` (1536 dimensions, $0.02 per 1M tokens)
- **LLM Model (Default):** `gpt-4o-mini` ($0.15/$0.60 per 1M input/output tokens)
- **LLM Model (Advanced):** `gpt-4o` ($2.50/$10 per 1M input/output tokens) - for complex reasoning
- **Vector Storage:** PostgreSQL with pgvector extension
- **Why OpenAI:** Industry-leading embeddings quality, reliable API, good cost/performance ratio

**Required Packages:**
- `openai` - Official OpenAI Node.js SDK
- `pgvector` - PostgreSQL vector extension for similarity search

---

## 📋 MVP Feature Checklist
1.  **Resume Parsing:** Upload PDF -> Auto-fill profile using OpenAI GPT-4o-mini (High Impact).
2.  **Semantic Search:** Find "React dev" when searching "Frontend engineer" using OpenAI embeddings.
3.  **Match Explanations:** "Why this job?" using OpenAI GPT-4o-mini (Trust).
4.  **Skill Verification:** AI-generated quizzes using OpenAI GPT-4o-mini.

---

## 🛠️ Phase 1: Infrastructure & Setup

### Step 1.1: Dependencies & Environment
1.  **Install Packages:**
    *   Run `npm install openai pdf-parse@^1.1.1`
    *   **Note:** Using `pdf-parse@^1.1.1` for Node 20.14.0 compatibility. If you have Node >=20.16.0, use latest `pdf-parse`.
    *   **Note:** `@types/pgvector` is not needed - Prisma handles vector types via `Unsupported`.
2.  **Environment Variables:**
    *   Add `OPENAI_API_KEY=sk-...` to `.env` (required).
    *   Add `OPENAI_EMBEDDING_MODEL=text-embedding-3-small` (default).
    *   Add `OPENAI_LLM_MODEL=gpt-4o-mini` (default).
    *   Add `SEMANTIC_SEARCH_ENABLED=true` (feature flag).
    *   Add `OPENAI_MAX_TOKENS=500` (for LLM responses, cost control).
    *   Add `OPENAI_RATE_LIMIT_PER_MINUTE=60` (rate limiting).
    *   **Validation:** Create `lib/ai/config.ts` to validate all env vars at startup, fail fast with clear errors.

### Step 1.2: Database Configuration
1.  **Enable pgvector:**
    *   Connect to your Postgres database and run: `CREATE EXTENSION IF NOT EXISTS vector;`
2.  **Update Prisma Schema (`prisma/schema.prisma`):**
    *   Add `previewFeatures = ["postgresqlExtensions"]` to the `client` generator.
    *   Add `extensions = [vector]` to the `datasource` block.
    *   Add an `embedding` field to `Skill`, `Opportunity`, `Project`, and `User` models.
        *   Type: `Unsupported("vector(1536)")?` (for `text-embedding-3-small`).
3.  **Apply Changes:**
    *   Run `npx prisma generate` and `npx prisma db push`.

### Step 1.3: OpenAI Client Wrapper
1.  **Create `lib/openai.ts` (if not exists, update existing):**
    ```typescript
    import OpenAI from 'openai'
    import { getOpenAIConfig } from './ai/config'
    
    // Initialize OpenAI client with API key from environment
    export function getOpenAIClient(): OpenAI {
      const config = getOpenAIConfig()
      return new OpenAI({
        apiKey: config.apiKey, // Must start with 'sk-'
      })
    }
    
    // Get model names from config
    export function getOpenAIModels() {
      const config = getOpenAIConfig()
      return {
        embedding: config.embeddingModel, // 'text-embedding-3-small'
        llm: config.llmModel, // 'gpt-4o-mini' or 'gpt-4o'
        maxTokens: config.maxTokens,
      }
    }
    ```
    *   **Error handling wrapper (already exists in `lib/openai.ts`):**
        *   The existing `withRetry()` function handles:
            *   `429` (rate limit) → retry with exponential backoff (1s, 2s, 4s)
            *   `500/503` (service unavailable) → retry up to 3 times
            *   `400/401/403` → fail immediately (don't retry)
        *   All errors are logged with correlation ID
    *   **Rate limiting:**
        *   Use existing `lib/ai/rate-limiter.ts`:
            *   Tracks requests per user/IP per minute
            *   Returns `429` if limit exceeded
    *   **Cost tracking:**
        *   Use existing `logAPICall()` function:
            *   Logs token usage (input + output tokens)
            *   Calculates cost based on model pricing
            *   Tracks in structured logs
    *   *Note: The OpenAI client wrapper already exists in your codebase at `lib/openai.ts` - verify it matches this structure.*

---

## 📄 Phase 2: Resume Parsing (MVP Priority)

### Step 2.1: Parsing Logic
1.  **Create Service `lib/ai/resume-parser.ts`:**
    *   **Input Sanitization:**
        *   Function `sanitizeInput(text: string)`:
            *   Remove PII (emails, phone numbers, SSNs) before sending to OpenAI.
            *   Use regex patterns to detect and redact sensitive data.
            *   Log sanitization actions (what was removed).
    *   Function `parseResume(text: string)`:
        *   Sanitize input first (remove PII).
        *   **Explicit OpenAI API Call:**
        ```typescript
        import { getOpenAIClient, getOpenAIModels } from '@/lib/openai'
        import { withRetry } from '@/lib/openai'
        
        const openai = getOpenAIClient()
        const models = getOpenAIModels()
        
        const response = await withRetry(async () => {
          return await openai.chat.completions.create({
            model: models.llm, // 'gpt-4o-mini'
            messages: [
              {
                role: 'system',
                content: 'You are a resume parser. Extract name, bio, skills (array), experience (array of {title, company, duration}), and education (array of {degree, institution, year}). Return JSON only. Do not include any personal identifying information like email, phone, or address.'
              },
              {
                role: 'user',
                content: sanitizedText
              }
            ],
            response_format: { type: 'json_object' }, // CRITICAL: Forces JSON output
            temperature: 0.0, // Deterministic output
            max_tokens: models.maxTokens, // 500 tokens
          })
        })
        
        const parsed = JSON.parse(response.choices[0].message.content || '{}')
        // Validate with Zod schema before returning
        ```
        *   Validate response against Zod schema.
        *   Return structured data.
2.  **PDF Text Extraction:**
    *   Use `pdf-parse` library (server-side).
    *   **Error handling:**
        *   Handle corrupted PDFs → return error message.
        *   Handle password-protected PDFs → return error message.
        *   Handle large files (>10MB) → reject or chunk processing.
    *   **File validation:**
        *   Check file type (must be PDF).
        *   Check file size (max 10MB recommended).
        *   Validate file structure before parsing.

### Step 2.2: API Endpoint
1.  **Create `app/api/ai/parse-resume/route.ts`:**
    *   **File Upload Handling:**
        *   Accept `POST` with `FormData` containing file.
        *   Validate file type (PDF only).
        *   Validate file size (max 10MB, configurable).
        *   Extract text from PDF using `pdf-parse`.
        *   If text extraction fails, return error with user-friendly message.
    *   **Rate Limiting:**
        *   Apply rate limiter (e.g., 5 requests per user per hour).
        *   Return `429` if limit exceeded.
    *   **Processing:**
        *   Call `parseResume()` with extracted text.
        *   Validate returned JSON structure using Zod schema.
        *   Log token usage and cost.
    *   **Error Handling:**
        *   Catch OpenAI errors → return user-friendly message.
        *   Catch parsing errors → return specific error message.
        *   Never expose internal errors to client.
    *   **Return:** Structured data to frontend, or error message.

### Step 2.3: UI Integration
1.  **Onboarding Flow:**
    *   Add an "Upload Resume" step before the manual profile form.
    *   On success, pre-fill the form fields (Bio, Skills, Experience) with the parsed data.
    *   *Crucial:* Allow the user to edit the data before saving. Never auto-save AI output.

---

## 🔍 Phase 3: Semantic Search

### Step 3.1: Embedding Generation Service
1.  **Create `lib/ai/embeddings.ts`:**
    *   **Caching Strategy:**
        *   Function `getCachedEmbedding(text: string, cacheKey?: string)`:
            *   Hash the input text (SHA-256).
            *   Check cache (Redis or in-memory Map) for existing embedding.
            *   Return cached embedding if found.
        *   Function `cacheEmbedding(text: string, embedding: number[])`:
            *   Store embedding in cache with TTL (24 hours).
    *   Function `generateEmbedding(text: string, useCache: boolean = true)`:
        *   If `useCache`, check cache first.
        *   If not cached, call `openai.embeddings.create` with `text-embedding-3-small`.
        *   **Error handling:**
            *   Retry on 429/500 errors with exponential backoff.
            *   Log token usage (input tokens = text length / 4, roughly).
        *   Cache the result.
        *   Return the vector (`number[]`).
    *   Function `updateEntityEmbedding(id, type, data)`:
        *   Construct a single text string from relevant fields (e.g., for Opportunity: title + description + skills).
        *   Check if text changed (compare hash) → skip if unchanged.
        *   Generate embedding (with caching).
        *   Update the database row using `db.$executeRaw` (since Prisma doesn't support vector writes natively yet).
        *   **Error handling:** If embedding generation fails, log error but don't block entity creation.

### Step 3.2: Search Logic
1.  **Create `lib/ai/search.ts`:**
    *   Function `semanticSearch(query, type, limit: number = 10)`:
        *   Generate embedding for the `query` (with caching).
        *   **Fallback:** If embedding generation fails, fall back to text search.
        *   Perform a cosine similarity search using raw SQL:
            *   `SELECT *, 1 - (embedding <=> $1::vector) as similarity FROM ... WHERE embedding IS NOT NULL ORDER BY similarity DESC LIMIT $2`
        *   **Blend results:** Combine semantic score with recency/popularity weights.
        *   Return results with similarity scores.
2.  **Update `app/api/search/route.ts`:**
    *   Check if `SEMANTIC_SEARCH_ENABLED` is true.
    *   If yes, use `semanticSearch`.
    *   If no, fall back to existing Postgres text search.
    *   **Error handling:** If semantic search fails, automatically fall back to text search.
    *   **Rate limiting:** Apply rate limiter (e.g., 20 requests per minute per user).

### Step 3.3: Background Job Queue for Embeddings
1.  **Job Queue Setup:**
    *   Install job queue: `npm install bullmq` or use Vercel Cron + API route.
    *   Create `lib/ai/embedding-queue.ts`:
        *   Queue name: `generate-embeddings`.
        *   Job payload: `{ entityType: 'user' | 'skill' | 'opportunity' | 'project', entityId: string, text: string }`.
        *   Retry: Up to 3 attempts with exponential backoff.
2.  **Worker Process:**
    *   Create `workers/embedding-worker.ts` (or API route with cron):
        *   Process jobs from queue.
        *   Call `generateEmbedding()` and `updateEntityEmbedding()`.
        *   Update database on completion.
        *   Log success/failure.
3.  **On Entity Create/Update:**
    *   Instead of generating embedding synchronously:
        *   Save entity immediately.
        *   Enqueue background job to generate embedding.
        *   Entity will have embedding populated when job completes.

---

## 🤝 Phase 4: Match Explanations & Verification

### Step 4.1: Match Explanations
1.  **Logic:**
    *   When fetching Opportunities for a user, identify the top match.
    *   Call LLM (`gpt-4o-mini`) with the User's Profile and the Job Description.
    *   **Prompt:** "Explain in one sentence why this job is a good match for this user. Focus on skills and location."
2.  **UI:**
    *   Display this "AI Insight" on the Opportunity card or details page.

### Step 4.2: Skill Verification Quizzes
1.  **Quiz Generator (`app/api/ai/quiz/route.ts`):**
    *   Input: `skillName` (e.g., "React").
    *   LLM Prompt: "Generate 3 multiple-choice questions to test beginner knowledge of React. Return JSON."
2.  **Verification Flow:**
    *   User clicks "Verify" on a skill.
    *   Show modal with generated questions.
    *   If user passes (e.g., 3/3 correct), update `UserSkill` record to `verified = true`.

---

## 🛡️ Guardrails & Safety
*   **Temperature:** Set to `0.0` - `0.3` for all tasks to ensure consistency.
*   **Validation:** Always validate LLM JSON output against a Zod schema before using it.
*   **User Control:** AI suggestions are *drafts*. User must always confirm/edit.
*   **Input Sanitization:**
    *   Remove PII (emails, phone numbers, SSNs) before sending to OpenAI.
    *   Sanitize user inputs to prevent prompt injection attacks.
    *   Content filtering: Check for profanity/inappropriate content (optional).
*   **Output Validation:**
    *   Strip URLs/emails from AI output if not expected.
    *   Clamp string lengths to prevent buffer overflows.
    *   Validate all structured outputs against schemas.

---

## 🔄 Phase 5: Migration & Operations

### Step 5.1: Batch Processing for Existing Data
1.  **Migration Script (`scripts/generate-embeddings-for-existing-data.ts`):**
    *   Find all entities without embeddings (users, skills, opportunities, projects).
    *   For each entity:
        1.  Construct text string from relevant fields.
        2.  Enqueue job to generate embedding (or process in batch).
        3.  Update database with embedding.
        4.  Log progress (success/failure per entity).
    *   **Batch processing:** Process 50 entities at a time to avoid rate limits.
    *   **Resume capability:** Track processed entities, allow script to resume from checkpoint.
    *   **Dry run mode:** Add `--dry-run` flag to test without generating embeddings.
    *   **Progress tracking:** Show progress bar or percentage complete.

### Step 5.2: Cost Tracking & Monitoring
1.  **Cost Estimation:**
    *   Track tokens used per API call (log in database or structured logs).
    *   Calculate cost:
        *   Embeddings: ~$0.02 per 1M tokens (text-embedding-3-small).
        *   LLM: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens (gpt-4o-mini).
    *   Function `calculateCost(tokens, model)` to estimate cost.
2.  **Monitoring:**
    *   Log all OpenAI API calls with: timestamp, model, input tokens, output tokens, cost, success/failure.
    *   Create dashboard/metrics endpoint to show:
        *   Total API calls per day/week.
        *   Total tokens used.
        *   Total cost per day/week/month.
        *   Success/failure rates.
        *   Average latency per request.
3.  **Alerting:**
    *   Alert if daily cost exceeds threshold (e.g., $100/day).
    *   Alert if error rate exceeds threshold (e.g., >10% failures).
    *   Alert if rate limit errors spike.

### Step 5.3: Feature Flags & Gradual Rollout
1.  **Feature Flag System:**
    *   Create `lib/ai/feature-flags.ts`:
        *   Check `SEMANTIC_SEARCH_ENABLED` env var.
        *   Per-user feature flags (optional, for A/B testing).
        *   Percentage rollout (e.g., enable for 10% of users initially).
2.  **Rollout Strategy:**
    *   Start with semantic search disabled (text search only).
    *   Enable for internal testing.
    *   Gradual rollout: 10% → 50% → 100% of users.
    *   Monitor error rates and performance at each stage.
3.  **Rollback Mechanism:**
    *   Ability to disable semantic search instantly via env var.
    *   Automatic fallback to text search if semantic search fails.

### Step 5.4: Data Consistency & Cleanup
1.  **Failed Embedding Handling:**
    *   If embedding generation fails during entity creation:
        *   Entity is created, but `embedding` field is `NULL`.
        *   Log error with entity ID.
        *   Retry job will attempt to generate embedding later.
2.  **Retry Mechanism:**
    *   Create endpoint `POST /api/admin/retry-embeddings`:
        *   Admin-only endpoint.
        *   Find entities without embeddings.
        *   Enqueue jobs to generate embeddings.
3.  **Cleanup Strategy:**
    *   Periodically check for orphaned embeddings (entities deleted but embeddings still exist).
    *   Cleanup script to remove stale cache entries.

### Step 5.5: Environment Variable Validation
1.  **Startup Validation (`lib/ai/config.ts`):**
    *   Function `validateOpenAIConfig()`:
        *   Check `OPENAI_API_KEY` exists and is valid format.
        *   Validate model names are valid.
        *   Test OpenAI API connection on startup (optional, but recommended).
        *   Throw clear error messages if validation fails.

### Step 5.6: Testing Strategy
1.  **Unit Tests:**
    *   Mock OpenAI API for testing.
    *   Test input sanitization.
    *   Test caching logic.
    *   Test error handling (rate limits, timeouts, etc.).
2.  **Integration Tests:**
    *   Use OpenAI test API key (or mock) for embedding generation.
    *   Test full flow: create entity → generate embedding → search.
    *   Test fallback to text search when embeddings fail.
3.  **E2E Tests:**
    *   Test resume parsing with sample PDF.
    *   Test semantic search returns relevant results.
    *   Test AI assist endpoints return valid JSON.

---

## 📚 Documentation Requirements
1.  **API Documentation:**
    *   Document all new endpoints (`/parse-resume`, `/ai/quiz`, etc.).
    *   Include request/response examples.
    *   Document rate limits and error codes.
2.  **Environment Setup:**
    *   Update `.env.example` with all new variables.
    *   Document how to get OpenAI API key.
    *   Document cost estimates for different usage patterns.
3.  **Troubleshooting Guide:**
    *   Common errors and solutions:
        *   "Rate limit exceeded" → Wait and retry, or increase rate limit.
        *   "OpenAI API error" → Check API key, check OpenAI status page.
        *   "Embedding generation failed" → Check logs, retry manually.
        *   "PDF parsing failed" → Check file format, try different PDF.

