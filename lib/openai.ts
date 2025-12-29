/**
 * OpenAI Client Wrapper
 * Provides configured OpenAI client with error handling and retry logic
 */

import OpenAI from "openai"
import { getOpenAIConfig } from "./ai/config"

let openaiClient: OpenAI | null = null

/**
 * Get or create OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = getOpenAIConfig()
    openaiClient = new OpenAI({
      apiKey: config.apiKey,
    })
  }
  return openaiClient
}

/**
 * Get model constants from config
 */
export function getOpenAIModels() {
  const config = getOpenAIConfig()
  return {
    embedding: config.embeddingModel,
    llm: config.llmModel,
    maxTokens: config.maxTokens,
  }
}

/**
 * Retry configuration for OpenAI API calls
 */
interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
}

/**
 * Exponential backoff delay calculator
 */
function getRetryDelay(attempt: number, initialDelay: number = 1000, maxDelay: number = 10000): number {
  const delay = initialDelay * Math.pow(2, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wrapper for OpenAI API calls with automatic retry on transient errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry on certain errors
      if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
        throw error // Bad request, unauthorized, or forbidden - don't retry
      }

      // Retry on rate limits and server errors
      if (error?.status === 429 || error?.status === 500 || error?.status === 503) {
        if (attempt < maxRetries) {
          const delay = getRetryDelay(attempt, initialDelay, maxDelay)
          console.warn(
            `OpenAI API error (${error.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`
          )
          await sleep(delay)
          continue
        }
      }

      // If it's not a retryable error or we've exhausted retries, throw
      throw error
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Unknown error in retry logic")
}

/**
 * Log OpenAI API call for cost tracking
 */
export function logAPICall(
  model: string,
  inputTokens: number,
  outputTokens: number,
  success: boolean,
  error?: string
) {
  // Calculate cost (approximate)
  const costs: Record<string, { input: number; output: number }> = {
    "text-embedding-3-small": { input: 0.02 / 1000000, output: 0 },
    "text-embedding-3-large": { input: 0.13 / 1000000, output: 0 },
    "text-embedding-ada-002": { input: 0.0001 / 1000, output: 0 },
    "gpt-4o-mini": { input: 0.15 / 1000000, output: 0.6 / 1000000 },
    "gpt-4o": { input: 2.5 / 1000000, output: 10 / 1000000 },
    "gpt-4-turbo": { input: 10 / 1000000, output: 30 / 1000000 },
    "gpt-3.5-turbo": { input: 0.5 / 1000000, output: 1.5 / 1000000 },
  }

  const modelCost = costs[model] || { input: 0, output: 0 }
  const cost = inputTokens * modelCost.input + outputTokens * modelCost.output

  const logData = {
    timestamp: new Date().toISOString(),
    model,
    inputTokens,
    outputTokens,
    cost: cost.toFixed(6),
    success,
    ...(error && { error }),
  }

  // Log to console (in production, send to monitoring service)
  if (process.env.NODE_ENV === "development") {
    console.log("[OpenAI API Call]", JSON.stringify(logData))
  }

  // TODO: In production, send to monitoring/logging service
  return logData
}
