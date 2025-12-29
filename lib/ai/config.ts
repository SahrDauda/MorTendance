/**
 * AI Configuration and Validation
 * Validates OpenAI environment variables and provides configuration
 */

export interface OpenAIConfig {
  apiKey: string
  embeddingModel: string
  llmModel: string
  maxTokens: number
  rateLimitPerMinute: number
  semanticSearchEnabled: boolean
}

/**
 * Validates OpenAI configuration from environment variables
 * Throws error with clear message if validation fails
 */
export function validateOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. Please add it to your .env file. Get your key at https://platform.openai.com/api-keys"
    )
  }

  if (!apiKey.startsWith("sk-")) {
    throw new Error(
      "OPENAI_API_KEY appears to be invalid. It should start with 'sk-'. Check your .env file."
    )
  }

  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
  const llmModel = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini"
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || "500", 10)
  const rateLimitPerMinute = parseInt(process.env.OPENAI_RATE_LIMIT_PER_MINUTE || "60", 10)
  const semanticSearchEnabled = process.env.SEMANTIC_SEARCH_ENABLED === "true"

  // Validate model names (basic check)
  const validEmbeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"]
  if (!validEmbeddingModels.includes(embeddingModel)) {
    console.warn(`Warning: OPENAI_EMBEDDING_MODEL "${embeddingModel}" may not be valid. Using anyway.`)
  }

  const validLLMModels = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]
  if (!validLLMModels.includes(llmModel)) {
    console.warn(`Warning: OPENAI_LLM_MODEL "${llmModel}" may not be valid. Using anyway.`)
  }

  return {
    apiKey,
    embeddingModel,
    llmModel,
    maxTokens,
    rateLimitPerMinute,
    semanticSearchEnabled,
  }
}

/**
 * Get validated OpenAI configuration
 * Caches the result to avoid re-validation
 */
let cachedConfig: OpenAIConfig | null = null

export function getOpenAIConfig(): OpenAIConfig {
  if (!cachedConfig) {
    cachedConfig = validateOpenAIConfig()
  }
  return cachedConfig
}

/**
 * Reset cached config (useful for testing)
 */
export function resetConfigCache() {
  cachedConfig = null
}




