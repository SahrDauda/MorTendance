/**
 * Application-wide constants
 * @module lib/constants
 */

// ============================================================================
// App Configuration
// ============================================================================

export const APP_NAME = "MOR Attendance" as const
export const APP_DESCRIPTION = "Ministry of Reconciliation Attendance System" as const
export const APP_VERSION = "1.0.0" as const

// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
export const API_TIMEOUT = 30000 // 30 seconds

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  PROFILE: "/auth/profile",

  // Ministry
  GROUPS: "/ministry/groups",
  MEMBERS: "/ministry/members",
  ATTENDANCE: "/ministry/attendance",
  REPORTS: "/ministry/reports",
  AI_INSIGHTS: "/ministry/ai-insights",
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
  SETTINGS: "/settings",
} as const

// ============================================================================
// Skill Categories
// ============================================================================

export const SKILL_CATEGORIES = [
  { value: "technical", label: "Technical Skills" },
  { value: "soft-skill", label: "Soft Skills" },
  { value: "domain-knowledge", label: "Domain Knowledge" },
  { value: "tools", label: "Tools & Platforms" },
  { value: "languages", label: "Programming Languages" },
] as const

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", color: "blue" },
  { value: "intermediate", label: "Intermediate", color: "cyan" },
  { value: "advanced", label: "Advanced", color: "teal" },
  { value: "expert", label: "Expert", color: "emerald" },
] as const

// ============================================================================
// Opportunity Types
// ============================================================================

export const OPPORTUNITY_TYPES = [
  { value: "job", label: "Full-time Job", icon: "briefcase" },
  { value: "internship", label: "Internship", icon: "graduation-cap" },
  { value: "project", label: "Project", icon: "code" },
  { value: "freelance", label: "Freelance", icon: "clock" },
  { value: "mentorship", label: "Mentorship", icon: "users" },
] as const

// ============================================================================
// Status & Badge Colors
// ============================================================================

export const STATUS_COLORS = {
  verified: "emerald",
  pending: "amber",
  unverified: "gray",
  active: "green",
  inactive: "gray",
  error: "red",
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
// File Upload
// ============================================================================

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"]
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf"]

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  BIO_MAX_LENGTH: 500,
  PROJECT_TITLE_MAX_LENGTH: 100,
  PROJECT_DESC_MAX_LENGTH: 2000,
} as const

// ============================================================================
// Animation Durations (ms)
// ============================================================================

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// ============================================================================
// WebSocket Events
// ============================================================================

export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  FEED_UPDATE: "feed:update",
  NOTIFICATION: "notification",
  SKILL_TRENDING: "skill:trending",
  OPPORTUNITY_NEW: "opportunity:new",
} as const
