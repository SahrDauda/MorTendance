export interface CampSessionDef {
  id: string
  name: string
  shortLabel: string
  day: "Tuesday" | "Wednesday" | "Thursday" | "Friday"
  category: "Teaching" | "Devotion" | "Departure" | "Special"
  reviewStartTime?: string // Time when attendance marking begins during review
  teachingStartTime: string // Official start time of the teaching (coming after this is LATE)
  endTime: string
  isTeachingSession: boolean
  description: string
}

export const CAMP_SCHEDULE: CampSessionDef[] = [
  // ==========================================
  // DAY 1 — TUESDAY
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
    id: "tue-registration",
    name: "Tuesday — Registration & Orientation (10:30 - 11:30 AM)",
    shortLabel: "Tuesday Registration & Orientation",
    day: "Tuesday",
    category: "Special",
    teachingStartTime: "10:30 AM",
    endTime: "11:30 AM",
    isTeachingSession: false,
    description: "Campground arrival, room check-in, and camp orientation.",
  },
  {
    id: "tue-teaching-1",
    name: "Tuesday — 1st Session of Teaching (1:30 - 4:00 PM)",
    shortLabel: "Tuesday 1st Teaching",
    day: "Tuesday",
    category: "Teaching",
    reviewStartTime: "1:30 PM",
    teachingStartTime: "1:45 PM",
    endTime: "4:00 PM",
    isTeachingSession: true,
    description: "First core teaching session of MOR Camp.",
  },
  {
    id: "tue-teaching-2",
    name: "Tuesday — 2nd Session of Teaching (6:15 - 9:15 PM)",
    shortLabel: "Tuesday 2nd Teaching",
    day: "Tuesday",
    category: "Teaching",
    reviewStartTime: "6:15 PM",
    teachingStartTime: "6:30 PM",
    endTime: "9:15 PM",
    isTeachingSession: true,
    description: "Second core teaching session of Day 1.",
  },

  // ==========================================
  // DAY 2 — WEDNESDAY
  // ==========================================
  {
    id: "wed-devotion",
    name: "Wednesday — Morning Devotion (5:30 - 6:15 AM)",
    shortLabel: "Wednesday Morning Devotion",
    day: "Wednesday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Early morning prayer and devotion.",
  },
  {
    id: "wed-teaching-1",
    name: "Wednesday — 1st Teaching (Review 8:00 AM | Teaching 8:30 - 11:30 AM)",
    shortLabel: "Wednesday 1st Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "8:00 AM",
    teachingStartTime: "8:30 AM",
    endTime: "11:30 AM",
    isTeachingSession: true,
    description: "Marking starts at 8:00 AM (Review). Anyone arriving after 8:30 AM is LATE.",
  },
  {
    id: "wed-teaching-2",
    name: "Wednesday — 2nd Teaching (Review 1:30 PM | Teaching 2:00 - 5:00 PM)",
    shortLabel: "Wednesday 2nd Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "1:30 PM",
    teachingStartTime: "2:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: true,
    description: "Afternoon teaching session. Review starts 1:30 PM; Late after 2:00 PM.",
  },
  {
    id: "wed-teaching-3",
    name: "Wednesday — 3rd Teaching (Review 7:00 PM | Teaching 8:00 - 10:30 PM)",
    shortLabel: "Wednesday 3rd Teaching",
    day: "Wednesday",
    category: "Teaching",
    reviewStartTime: "7:00 PM",
    teachingStartTime: "8:00 PM",
    endTime: "10:30 PM",
    isTeachingSession: true,
    description: "Evening teaching session. Review starts 7:00 PM; Late after 8:00 PM.",
  },

  // ==========================================
  // DAY 3 — THURSDAY
  // ==========================================
  {
    id: "thu-devotion",
    name: "Thursday — Morning Devotion (5:30 - 6:15 AM)",
    shortLabel: "Thursday Morning Devotion",
    day: "Thursday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Early morning prayer and devotion.",
  },
  {
    id: "thu-teaching-1",
    name: "Thursday — 1st Teaching (Review 8:00 AM | Teaching 8:30 - 11:30 AM)",
    shortLabel: "Thursday 1st Teaching",
    day: "Thursday",
    category: "Teaching",
    reviewStartTime: "8:00 AM",
    teachingStartTime: "8:30 AM",
    endTime: "11:30 AM",
    isTeachingSession: true,
    description: "Morning teaching session. Review starts 8:00 AM; Late after 8:30 AM.",
  },
  {
    id: "thu-teaching-2",
    name: "Thursday — 2nd Teaching (Review 1:30 PM | Teaching 2:00 - 5:00 PM)",
    shortLabel: "Thursday 2nd Teaching",
    day: "Thursday",
    category: "Teaching",
    reviewStartTime: "1:30 PM",
    teachingStartTime: "2:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: true,
    description: "Afternoon teaching session. Review starts 1:30 PM; Late after 2:00 PM.",
  },
  {
    id: "thu-teaching-3",
    name: "Thursday — 3rd Teaching (Review 7:00 PM | Teaching 8:00 - 10:30 PM)",
    shortLabel: "Thursday 3rd Teaching",
    day: "Thursday",
    category: "Teaching",
    reviewStartTime: "7:00 PM",
    teachingStartTime: "8:00 PM",
    endTime: "10:30 PM",
    isTeachingSession: true,
    description: "Night teaching session. Review starts 7:00 PM; Late after 8:00 PM.",
  },

  // ==========================================
  // DAY 4 — FRIDAY
  // ==========================================
  {
    id: "fri-devotion",
    name: "Friday — Morning Devotion (5:30 - 6:15 AM)",
    shortLabel: "Friday Morning Devotion",
    day: "Friday",
    category: "Devotion",
    teachingStartTime: "5:30 AM",
    endTime: "6:15 AM",
    isTeachingSession: false,
    description: "Early morning prayer and devotion on final day.",
  },
  {
    id: "fri-commissioning",
    name: "Friday — Grand Impartation & Commissioning Service (9:00 - 12:00 PM)",
    shortLabel: "Friday Commissioning Service",
    day: "Friday",
    category: "Special",
    reviewStartTime: "9:00 AM",
    teachingStartTime: "9:15 AM",
    endTime: "12:00 PM",
    isTeachingSession: true,
    description: "Final impartation, commissioning, and anointing service.",
  },
  {
    id: "fri-departure",
    name: "Friday — Camp Departure / Return Buses (3:00 PM Prompt)",
    shortLabel: "Friday Departure Buses",
    day: "Friday",
    category: "Departure",
    teachingStartTime: "3:00 PM",
    endTime: "5:00 PM",
    isTeachingSession: false,
    description: "Boarding return buses back to Headquarters, Eastern, and Bo branches.",
  },
]

export function getSessionDef(nameOrId: string): CampSessionDef | undefined {
  return (
    CAMP_SCHEDULE.find((s) => s.id === nameOrId) ||
    CAMP_SCHEDULE.find((s) => s.name === nameOrId)
  )
}

export function getNextSession(currentSessionName: string): CampSessionDef | null {
  const index = CAMP_SCHEDULE.findIndex(
    (s) => s.name === currentSessionName || s.id === currentSessionName
  )
  if (index >= 0 && index < CAMP_SCHEDULE.length - 1) {
    return CAMP_SCHEDULE[index + 1]
  }
  return null
}

export function getPreviousSession(currentSessionName: string): CampSessionDef | null {
  const index = CAMP_SCHEDULE.findIndex(
    (s) => s.name === currentSessionName || s.id === currentSessionName
  )
  if (index > 0) {
    return CAMP_SCHEDULE[index - 1]
  }
  return null
}
