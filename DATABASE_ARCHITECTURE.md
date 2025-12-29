# MOR Attendance - Database Architecture

## Overview
The Ministry of Reconciliation (MOR) Attendance System is designed to track growth, consistency, and discipleship through weekly fellowship attendance.

## Core Entities

### 1. Users (Staff)
Internal users who manage the system.
- **Roles:**
  - `ADMIN`: Full system access, manages groups and coordinators.
  - `COORDINATOR`: Manages multiple groups and views reports.
  - `LEADER`: Manages a specific group and records weekly attendance.

### 2. Ministry Groups
The fellowship is divided into three primary groups:
- **Huiothesia**
- **Doxasmus**
- **Paligenasia**

### 3. Members
Individuals belonging to a group.
- **Progression Status:**
  - `PRELIMINARY`: New members.
  - `SEMI_CONSISTENT`: Members who have attended at least 3 fellowships.
  - `ESTABLISHED`: Confirmed consistent members.

### 4. Attendance
Weekly records for each member.
- **Status:** Present (PR) or Absent (AB).
- **Metadata:** Recorded per quarter and year.

---

## Database Schema (Prisma)

```prisma
enum UserRole {
  ADMIN
  COORDINATOR
  LEADER
}

enum MemberStatus {
  PRELIMINARY
  SEMI_CONSISTENT
  ESTABLISHED
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  passwordHash  String         @map("password_hash")
  role          UserRole       @default(LEADER)
  managedGroups MinistryGroup[] @relation("GroupLeader")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  @@map("users")
}

model MinistryGroup {
  id        String   @id @default(uuid())
  name      String   @unique // Huiothesia, Doxasmus, Paligenasia
  leaderId  String?  @map("leader_id")
  leader    User?    @relation("GroupLeader", fields: [leaderId], references: [id])
  members   Member[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("ministry_groups")
}

model Member {
  id          String       @id @default(uuid())
  name        String
  groupId     String       @map("group_id")
  group       MinistryGroup @relation(fields: [groupId], references: [id])
  status      MemberStatus @default(PRELIMINARY)
  attendance  Attendance[]
  joinedAt    DateTime     @default(now()) @map("joined_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@map("members")
}

model Attendance {
  id        String   @id @default(uuid())
  memberId  String   @map("member_id")
  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date
  isPresent Boolean  @default(false) @map("is_present")
  quarter   Int      // 1, 2, 3, 4
  year      Int
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([memberId, date])
  @@map("attendance")
}

model AIInsight {
  id        String   @id @default(uuid())
  type      String   // 'GROUP_PERFORMANCE', 'MEMBER_RETENTION', 'GROWTH_PREDICTION'
  content   String   @db.Text
  targetId  String?  // Optional ID of group or member
  createdAt DateTime @default(now()) @map("created_at")

  @@map("ai_insights")
}
```

## Key Relationships
- **User ↔ MinistryGroup:** A Leader is assigned to a group.
- **MinistryGroup ↔ Member:** Each member belongs to exactly one group.
- **Member ↔ Attendance:** One-to-many relationship tracking weekly presence.

## Performance & Scaling
- **Indexing:** Indexes on `Attendance(date)`, `Member(status)`, and `MinistryGroup(name)`.
- **Partitioning:** Attendance records can be partitioned by `year` and `quarter` as the dataset grows.
