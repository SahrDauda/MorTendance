/**
 * Validation utilities
 * @module lib/validators
 */

import { VALIDATION } from "./constants"

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate username
 */
export function isValidUsername(username: string): {
  valid: boolean
  error?: string
} {
  if (username.length < VALIDATION.USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`,
    }
  }
  if (username.length > VALIDATION.USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be at most ${VALIDATION.USERNAME_MAX_LENGTH} characters`,
    }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, hyphens, and underscores",
    }
  }
  return { valid: true }
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

/**
 * Validate file type
 */
export function isValidFileType(type: string, acceptedTypes: string[]): boolean {
  return acceptedTypes.includes(type)
}
