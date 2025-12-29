/**
 * Formatting utilities for dates, numbers, and strings
 * @module lib/format
 */

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = "SLL", locale = "en-SL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, format: "short" | "long" | "with-time" = "short"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : format === "long"
        ? { month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }

  return new Intl.DateTimeFormat("en-US", options).format(dateObj)
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

/**
 * Convert a string to title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
