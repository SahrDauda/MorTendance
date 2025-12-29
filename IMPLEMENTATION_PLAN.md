# MOR Attendance - Implementation Plan

## Phase 1: Environment & Database Setup
- [ ] **New Database Initialization:** Create a fresh PostgreSQL database for MOR.
- [ ] **Environment Variables:** Update `.env` with the new `DATABASE_URL`.
- [ ] **Prisma Migration:** Run `npx prisma migrate dev --name init_mor` to set up the new schema.
- [ ] **Seed Data:** Create a seed script for the three groups (Huiothesia, Doxasmus, Paligenasia) and initial admin users.

## Phase 2: Core Authentication & Layout
- [ ] **RBAC Implementation:** Update `lib/auth.ts` and middleware to handle `ADMIN`, `COORDINATOR`, and `LEADER` roles.
- [ ] **Navigation System:** Build a sidebar/bottom-nav tailored to attendance (Dashboard, Attendance, Members, Reports).
- [ ] **Protected Routes:** Ensure only authorized roles can access specific ministry features.

## Phase 3: Attendance Management (The "Battle-Tested" Core)
- [ ] **Attendance Screen:**
  - Group selection (for Coordinators/Admins).
  - Date picker (defaults to current date).
  - Member list with PR/AB toggles.
  - Optimistic UI updates for fast recording.
- [ ] **Auto-Progression Logic:** Implement server-side logic to update member status (Preliminary -> Semi-consistent) after 3 attendances.

## Phase 4: Member & Group Management
- [ ] **Member CRM:** List, filter, and add new members to groups.
- [ ] **Group Dashboard:** View group-specific stats and leader assignments.
- [ ] **Member Profiles:** Detailed view of individual attendance history and growth.

## Phase 5: AI Analytics & Reporting
- [ ] **Reporting Engine:** Build quarterly and yearly attendance reports.
- [ ] **AI Growth Consultant:** 
  - Integrate OpenAI to analyze attendance patterns.
  - Generate insights on retention and group performance.
- [ ] **Visualizations:** Implement charts for attendance trends and group comparisons.

## Phase 6: Polish & Performance
- [ ] **Mobile Optimization:** Ensure the attendance toggle is high-performance on low-end mobile devices.
- [ ] **Error Handling:** Robust toasts and validation for attendance saves.
- [ ] **Final QA:** Test with real-world scenarios (slow networks, large member lists).
