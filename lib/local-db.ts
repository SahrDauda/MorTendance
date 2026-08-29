// lib/local-db.ts

import Dexie, { Table } from "dexie"

/**
 * Interfaces representing the core entities stored locally.
 * These mirror the server models but are trimmed to the fields we need
 * for offline operation.
 */
export interface Member {
  id: string
  fullName: string
  badgeId: string
  caregroup?: string
  // Store the session the roster belongs to for quick lookup
  session: string
  // Additional optional fields can be added if needed
}

export interface Group {
  id: string
  name: string
  // Optional extra metadata
  description?: string
}

export interface Attendance {
  id: string
  memberId: string
  session: string
  isPresent: boolean
  isLate: boolean
  scannedAt: string
  recordedBy?: string | null
}

export interface ScheduleDef {
  session: string
  shortLabel: string
  // Any other schedule‑specific fields can be added here
  [key: string]: any
}

/**
 * Dexie database definition.
 * The database name "MORCampDB" is scoped to this application.
 */
export class LocalDB extends Dexie {
  members!: Table<Member, string>
  groups!: Table<Group, string>
  attendance!: Table<Attendance, string>
  schedules!: Table<ScheduleDef, string>

  constructor() {
    super("MORCampDB")
    // Define object stores and indexes. Primary key is the field before the colon.
    this.version(1).stores({
      members: "id, badgeId, caregroup, session",
      groups: "id, name",
      attendance: "id, memberId, session, isPresent, isLate, scannedAt, recordedBy",
      schedules: "session, shortLabel",
    })
  }
}

/** Export a singleton instance for the whole app to use. */
export const db = new LocalDB()

/** Helper functions for common operations */
export const clearAllData = async () => {
  await db.transaction("rw", db.members, db.groups, db.attendance, db.schedules, async () => {
    await db.members.clear()
    await db.groups.clear()
    await db.attendance.clear()
    await db.schedules.clear()
  })
}

export const bulkAddMembers = async (members: Member[]) => {
  await db.members.bulkPut(members)
}

export const getMembersBySession = async (session: string) => {
  return await db.members.where("session").equals(session).toArray()
}

export const bulkAddGroups = async (groups: Group[]) => {
  await db.groups.bulkPut(groups)
}

export const bulkAddAttendance = async (records: Attendance[]) => {
  await db.attendance.bulkPut(records)
}

export const bulkAddSchedules = async (defs: ScheduleDef[]) => {
  await db.schedules.bulkPut(defs)
}

export const getAllGroups = async () => {
  return await db.groups.toArray()
}

export const getAllAttendance = async (session?: string) => {
  if (session) {
    return await db.attendance.where("session").equals(session).toArray()
  }
  return await db.attendance.toArray()
}

export const getAllSchedules = async () => {
  return await db.schedules.toArray()
}
