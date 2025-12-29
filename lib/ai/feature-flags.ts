/**
 * Feature Flags for AI Features
 * Controls gradual rollout and A/B testing
 */

import { getOpenAIConfig } from "./config"

/**
 * Check if semantic search is enabled
 */
export function isSemanticSearchEnabled(): boolean {
  return getOpenAIConfig().semanticSearchEnabled
}

/**
 * Check if feature is enabled for a specific user (for gradual rollout)
 * @param userId - User ID to check
 * @param featureName - Name of the feature
 * @param percentage - Percentage of users to enable for (0-100)
 */
export function isFeatureEnabledForUser(
  userId: string,
  featureName: string,
  percentage: number = 100
): boolean {
  if (percentage >= 100) return true
  if (percentage <= 0) return false

  // Simple hash-based percentage check (deterministic per user)
  const hash = simpleHash(`${userId}:${featureName}`)
  const threshold = (hash % 100) + 1 // 1-100

  return threshold <= percentage
}

/**
 * Simple hash function for deterministic user assignment
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Check if AI feature should be enabled
 * Combines global flag with user-specific percentage
 */
export function shouldEnableAIFeature(
  userId: string | null,
  featureName: string = "semantic_search",
  rolloutPercentage: number = 100
): boolean {
  // Check global flag first
  if (!isSemanticSearchEnabled()) {
    return false
  }

  // If no user ID, allow (for public endpoints)
  if (!userId) {
    return true
  }

  // Check user-specific rollout
  return isFeatureEnabledForUser(userId, featureName, rolloutPercentage)
}




