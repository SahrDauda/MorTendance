import type React from "react"
/**
 * Core type definitions for the Bridge platform
 * @module types
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "student" | "institution" | "employer"
  createdAt: string | Date
  updatedAt: string | Date
}

export interface LearnerProfile extends User {
  bio?: string
  location?: string
  university?: string
  major?: string
  graduationYear?: number
  skillsMatchPercentage: number
  verificationStatus: VerificationStatus
}

export type VerificationStatus = "verified" | "pending" | "unverified"

// ============================================================================
// Skills & Credentials Types
// ============================================================================

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  level: SkillLevel
  verified: boolean
  endorsements: number
  trending?: TrendingData
}

export type SkillCategory = "technical" | "soft-skill" | "domain-knowledge" | "tools" | "languages"

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert"

export interface TrendingData {
  demandPercentage: number
  growthRate: number
  averageSalary: number
  openPositions: number
}

export interface Credential {
  id: string
  title: string
  issuer: string
  issueDate: Date | string
  expiryDate?: Date | string
  verified: boolean
  blockchainHash?: string
  qrCode?: string
  type: CredentialType
  skills: string[]
}

export type CredentialType = "certification" | "degree" | "badge" | "course-completion" | "project"

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string
  title: string
  description: string
  userId: string
  media: MediaItem[]
  skills: string[]
  collaborators: string[]
  endorsements: Endorsement[]
  verified: boolean
  visibility: "public" | "private" | "connections"
  startDate: string | Date
  endDate?: string | Date | null
  githubUrl?: string
  liveUrl?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface MediaItem {
  id: string
  type: "image" | "video" | "document"
  url: string
  thumbnail?: string
  caption?: string
}

export interface Endorsement {
  id: string
  endorserId: string
  endorserName: string
  endorserAvatar?: string
  comment?: string
  skills: string[]
  createdAt: string | Date
}

// ============================================================================
// Career Navigation Types
// ============================================================================

export interface CareerPath {
  id: string
  currentRole: string
  targetRole: string
  timeline: PathwayNode[]
  skillsGap: SkillGap[]
  estimatedDuration: number // months
  salaryProgression: SalaryData[]
}

export interface PathwayNode {
  id: string
  stage: string
  title: string
  duration: number
  requirements: string[]
  milestones: string[]
  completed: boolean
}

export interface SkillGap {
  skill: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  priority: "high" | "medium" | "low"
  recommendedCourses: Course[]
}

export interface SalaryData {
  role: string
  min: number
  max: number
  average: number
  location: string
}

// ============================================================================
// Opportunities Types
// ============================================================================

export interface Opportunity {
  id: string
  title: string
  company: string
  companyLogo?: string
  type: OpportunityType
  location: string
  remote: boolean
  description: string
  requirements: string[]
  skills: string[]
  matchScore: number
  salary?: SalaryRange
  postedDate: Date | string
  deadline?: Date | string
  applicationUrl?: string
}

export type OpportunityType = "job" | "internship" | "project" | "freelance" | "mentorship"

export interface SalaryRange {
  min: number
  max: number
  currency: string
}

// ============================================================================
// Network Types
// ============================================================================

export interface Connection {
  id: string
  userId: string
  name: string
  avatar?: string
  role: string
  company?: string
  university?: string
  connectionType: ConnectionType
  mutualConnections: number
  connectedAt: string | Date
}

export type ConnectionType = "peer" | "alumni" | "mentor" | "recruiter" | "colleague"

export interface NetworkSuggestion extends Connection {
  reason: string
  matchScore: number
}

// ============================================================================
// Learning & Courses Types
// ============================================================================

export interface Course {
  id: string
  title: string
  provider: string
  description: string
  thumbnail?: string
  duration: number // hours
  level: SkillLevel
  skills: string[]
  rating: number
  reviewCount: number
  price: number
  currency: string
  url: string
  relevanceScore?: number
}

// ============================================================================
// Feed & Activity Types
// ============================================================================

export interface FeedItem {
  id: string
  type: FeedItemType
  timestamp: string | Date
  priority: "high" | "medium" | "low"
  content: FeedContent
  actions?: FeedAction[]
}

export type FeedItemType =
  | "opportunity"
  | "skill-trending"
  | "network-activity"
  | "insight"
  | "recommendation"
  | "achievement"

export interface FeedContent {
  title: string
  description: string
  image?: string
  data?: Record<string, any>
}

export interface FeedAction {
  label: string
  action: string
  variant?: "primary" | "secondary" | "outline"
}

// ============================================================================
// Analytics & Insights Types
// ============================================================================

export interface MarketInsight {
  id: string
  category: string
  title: string
  description: string
  trend: "up" | "down" | "stable"
  percentage: number
  data: ChartDataPoint[]
  source: string
  updatedAt: string | Date
}

export interface ChartDataPoint {
  label: string
  value: number
  metadata?: Record<string, any>
}

// ============================================================================
// Verification & Blockchain Types
// ============================================================================

export interface VerificationRequest {
  id: string
  credentialId: string
  requestedBy: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string | Date
  processedAt?: string | Date
}

export interface BlockchainVerification {
  hash: string
  timestamp: string | Date
  network: string
  verified: boolean
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  pagination?: PaginationMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface DashboardMetrics {
  skillsMatch: number
  trendingSkillsCount: number
  opportunitiesCount: number
  networkGrowth: number
  projectsCompleted: number
  credentialsEarned: number
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string
  type: "opportunity" | "connection" | "skill" | "project" | "credential" | "trending"
  title: string
  message: string
  timestamp: string | Date
  read: boolean
  actionUrl?: string
  icon?: string
}
