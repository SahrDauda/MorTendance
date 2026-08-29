export interface CampSessionDef {
  id: string
  name: string
  shortLabel: string
  day: "Tuesday" | "Wednesday" | "Thursday" | "Friday"
  category: "Teaching" | "Devotion" | "Departure" | "Special"
  reviewStartTime?: string // Time when attendance marking / review begins
  teachingStartTime: string // Official start time of the teaching (after this time is LATE)
  endTime: string
  isTeachingSession: boolean
  description: string
}

export const CAMP_SCHEDULE: CampSessionDef[] = [
  // ==========================================
  // DAY 1 (TUESDAY)
  // ==========================================
  {
    id: "tue-bus-departure",
    name: "Tuesday — Bus Boarding (Departure Check-In)",
    shortLabel: "Tuesday Bus Boarding",
    day: "Tuesday",
    category: "Departure",
    teachingStartTime: "07:00 AM",
    endTime: "09:30 AM",
    isTeachingSession: false,
    description: "Calling member names and checking in before entering departure buses.",
  },
  {
    id: "tue-teaching-1",
    name: "Tuesday — First Session of Teaching (1:30 - 4:00 PM)",
    shortLabel: "Tuesday 1st Teaching",
    day: "Tuesday",
    category: "Teaching",
    reviewStartTime: "1:00 PM",
    teachingStartTime: "1:30 PM",
    endTime: "4:00 PM",
    isTeachingSession: true,
    description: "Check-in during review 1:00 to 1:30 PM. Anyone arriving after 1:30 PM is LATE.",
  },
  {
    id: "tue-teaching-2",
    name: "Tuesday — Second Session of Teaching (6:15 - 9:15 PM)",
    shortLabel: "Tuesday 2nd Teaching",
    day: "Tuesday",
    category: "Teaching",
    reviewStartTime: "6:00 PM",
    teachingStartTime: "6:20 PM",
    endTime: "9:15 PM",
    isTeachingSession: true,
    description: "Check-in during review 6:00 to 6:20 PM. Anyone arriving after 6:20 PM is LATE.",
  },

  // ==========================================
  // DAY 2 (WEDNESDAY)
  // ==========================================
  {
    id: "wed-devotion",
    name: "Wednesday — Morning’s Devotion (5:30 - 6:15 AM)",
    shortLabel: "Wednesday Morning Devotion",
    day: "Wednesday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Early morning devotion. Check-in starts 5:30 AM.",
  },
  {
    id: "wed-teaching-1",
    name: "Wednesday — First Session of Teaching (8:30 - 11:30 AM)",
    shortLabel: "Wednesday 1st Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "8:00 AM",
    teachingStartTime: "8:30 AM",
    endTime: "11:30 AM",
    isTeachingSession: true,
    description: "Check-in during 30 mins review (8:00 to 8:30 AM). Anyone arriving after 8:30 AM is LATE.",
  },
  {
    id: "wed-teaching-2",
    name: "Wednesday — Second Session of Teaching (2:00 - 5:00 PM)",
    shortLabel: "Wednesday 2nd Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "1:30 PM",
    teachingStartTime: "2:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: true,
    description: "Check-in during 30 mins review (1:30 to 2:00 PM). Anyone arriving after 2:00 PM is LATE.",
  },
  {
    id: "wed-teaching-3",
    name: "Wednesday — Third Session of Teaching (8:00 - 10:00 PM)",
    shortLabel: "Wednesday 3rd Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "7:00 PM",
    teachingStartTime: "8:00 PM",
    endTime: "10:00 PM",
    isTeachingSession: true,
    description: "Check-in during review (7:00 to 7:30 PM). Anyone arriving after 8:00 PM is LATE.",
  },

  // ==========================================
  // DAY 3 (THURSDAY)
  // ==========================================
  {
    id: "thu-devotion",
    name: "Thursday — Morning’s Devotion (5:30 - 6:15 AM)",
    shortLabel: "Thursday Morning Devotion",
    day: "Thursday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Early morning devotion. Check-in starts 5:30 AM.",
  },
  {
    id: "thu-teaching-1",
    name: "Thursday — First Session of Teaching (8:30 - 11:30 AM)",
    shortLabel: "Thursday 1st Teaching",
    day: "Thursday",
    category: "Teaching",
    reviewStartTime: "8:00 AM",
    teachingStartTime: "8:30 AM",
    endTime: "11:30 AM",
    isTeachingSession: true,
    description: "Check-in during 30 mins review (8:00 to 8:30 AM). Anyone arriving after 8:30 AM is LATE.",
  },
  {
    id: "thu-teaching-2",
    name: "Thursday — Second Session of Teaching (2:00 - 5:00 PM)",
    shortLabel: "Thursday 2nd Teaching",
    day: "Thursday",
    category: "Teaching",
    reviewStartTime: "1:30 PM",
    teachingStartTime: "2:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: true,
    description: "Check-in during 30 mins review (1:30 to 2:00 PM). Anyone arriving after 2:00 PM is LATE.",
  },
  {
    id: "thu-teaching-3",
    name: "Thursday — Third Session (Exams, Bible Interaction, Prayer & Games) (7:00 - 10:00 PM)",
    shortLabel: "Thursday 3rd Session",
    day: "Thursday",
    category: "Special",
    teachingStartTime: "7:00 PM",
    endTime: "10:00 PM",
    isTeachingSession: false,
    description: "Exams (1hr), Bible interaction, Prayer and Games (7:00 to 10:00 PM).",
  },

  // ==========================================
  // DAY 4 (FRIDAY)
  // ==========================================
  {
    id: "fri-devotion",
    name: "Friday — Morning’s Devotion (5:30 - 6:15 AM)",
    shortLabel: "Friday Morning Devotion",
    day: "Friday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Final day early morning prayer and devotion.",
  },
  {
    id: "fri-grand-service",
    name: "Friday — Grand Impartation Service (9:00 - 12:00 PM)",
    shortLabel: "Friday Grand Service",
    day: "Friday",
    category: "Special",
    teachingStartTime: "9:00 AM",
    endTime: "12:00 PM",
    isTeachingSession: true,
    description: "Grand Impartation, Commissioning, and Anointing Service (9:00 AM to 12:00 PM).",
  },
  {
    id: "fri-departure",
    name: "Friday — Camp Departure (3:00 PM Prompt)",
    shortLabel: "Friday Camp Departure",
    day: "Friday",
    category: "Departure",
    teachingStartTime: "3:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: false,
    description: "Camp departure and boarding buses back to branches.",
  },
]

export function getSessionDef(nameOrId: string): CampSessionDef | undefined {
  if (!nameOrId) return undefined
  const clean = nameOrId.toLowerCase().trim()
  return (
    CAMP_SCHEDULE.find((s) => s.id === nameOrId) ||
    CAMP_SCHEDULE.find((s) => s.name === nameOrId) ||
    CAMP_SCHEDULE.find((s) => s.name.toLowerCase() === clean) ||
    CAMP_SCHEDULE.find((s) => s.shortLabel.toLowerCase() === clean) ||
    CAMP_SCHEDULE.find(
      (s) => s.name.toLowerCase().includes(clean) || clean.includes(s.shortLabel.toLowerCase())
    )
  )
}

export function getNextSession(currentSessionName: string): CampSessionDef | null {
  const current = getSessionDef(currentSessionName)
  if (!current) return null
  const index = CAMP_SCHEDULE.findIndex((s) => s.id === current.id)
  if (index >= 0 && index < CAMP_SCHEDULE.length - 1) {
    return CAMP_SCHEDULE[index + 1]
  }
  return null
}

export function getPreviousSession(currentSessionName: string): CampSessionDef | null {
  const current = getSessionDef(currentSessionName)
  if (!current) return null
  const index = CAMP_SCHEDULE.findIndex((s) => s.id === current.id)
  if (index > 0) {
    return CAMP_SCHEDULE[index - 1]
  }
  return null
}

/**
 * Automatically computes whether check-in is late for a session
 * based on standard Sierra Leone time (UTC+0 / GMT).
 */
export function isCheckInLate(sessionNameOrId: string, checkInDate = new Date()): boolean {
  const session = getSessionDef(sessionNameOrId)
  if (!session) return false

  const cutoffStr = session.teachingStartTime
  if (!cutoffStr) return false

  const match = cutoffStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return false

  let cutoffHours = parseInt(match[1], 10)
  const cutoffMinutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === "PM" && cutoffHours !== 12) cutoffHours += 12
  if (period === "AM" && cutoffHours === 12) cutoffHours = 0

  const cutoffMinutesOfDay = cutoffHours * 60 + cutoffMinutes

  // Sierra Leone is UTC+0 (GMT)
  const checkInHours = checkInDate.getUTCHours()
  const checkInMinutes = checkInDate.getUTCMinutes()
  const checkInMinutesOfDay = checkInHours * 60 + checkInMinutes

  return checkInMinutesOfDay > cutoffMinutesOfDay
}
