/**
 * Application-wide constants
 * @module lib/constants
 */

// ============================================================================
// App Configuration
// ============================================================================

export const APP_NAME = "MorTendance" as const
export const APP_DESCRIPTION = "Ministry of Reconciliation Attendance System" as const
export const APP_VERSION = "1.0.0" as const

// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
export const API_TIMEOUT = 30000 // 30 seconds

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/signin",
  LOGOUT: "/auth/signout",

  // Ministry (Server Actions are preferred, but these are for reference)
  GROUPS: "/ministry/groups",
  MEMBERS: "/ministry/members",
  ATTENDANCE: "/ministry/attendance",
  REPORTS: "/ministry/reports",
} as const

// ============================================================================
// Navigation Routes
// ============================================================================

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  ATTENDANCE: "/attendance",
  MEMBERS: "/members",
  REPORTS: "/reports",
  ADVANCED_REPORTS: "/reports/advanced",
  SETTINGS: "/settings",
  QR_GENERATOR: "/attendance/qr",
  CBS: "/admin/cbs",
  BRANCHES: "/admin/branches",
  GROUPS: "/admin/groups",
  USERS: "/admin/users",
  LOGS: "/admin/logs",
  MINISTRY_SETTINGS: "/admin/settings",
  PROFILE: "/profile",
  CAMP_MEMBERS: "/camp/members",
  CAMP_ROOMS: "/camp/rooms",
  CAMP_GROUPS: "/camp/groups",
  CAMP_ATTENDANCE: "/camp/attendance",
  CAMP_ANALYSIS: "/camp/analysis",
  CAMP_TAGS: "/camp/print-tags",
} as const

// ============================================================================
// Status & Badge Colors
// ============================================================================

export const STATUS_COLORS = {
  active: "green",
  inactive: "gray",
  error: "red",
  preliminary: "blue",
  semi_consistent: "amber",
  established: "emerald",
} as const

// ============================================================================
// Chart Colors
// ============================================================================

export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
} as const

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ============================================================================
// Date Formats
// ============================================================================

export const DATE_FORMATS = {
  SHORT: "MMM dd, yyyy",
  LONG: "MMMM dd, yyyy",
  WITH_TIME: "MMM dd, yyyy HH:mm",
  RELATIVE: "relative",
} as const

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const

// ============================================================================
// Animation Durations (ms)
// ============================================================================

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const
