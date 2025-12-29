# MOR Attendance - Implementation Plan

## Phase 1: Environment & Database Setup
- [x] **New Database Initialization:** Create a fresh PostgreSQL database for MOR.
- [x] **Environment Variables:** Update `.env` with the new `DATABASE_URL`.
- [x] **Prisma Migration:** Run `npx prisma migrate dev --name init_mor` to set up the new schema.
- [x] **Seed Data:** Create a seed script for the three groups (Huiothesia, Doxasmus, Paligenasia) and initial admin users.

## Phase 2: Core Authentication & Layout
- [x] **RBAC Implementation:** Update `lib/auth.ts` and middleware to handle `ADMIN`, `COORDINATOR`, and `LEADER` roles.
- [x] **Navigation System:** Build a sidebar/bottom‑nav tailored to attendance (Dashboard, Attendance, Members, Reports).
- [x] **Protected Routes:** Ensure only authorized roles can access specific ministry features.

## Phase 3: Attendance Management (The "Battle‑Tested" Core)
- [x] **Attendance Screen:**
  - Group selection (for Coordinators/Admins).
  - Date picker (defaults to current date).
  - Member list with PR/AB toggles.
  - Optimistic UI updates for fast recording.
- [x] **Auto‑Progression Logic:** Implement server‑side logic to update member status (Preliminary → Semi‑consistent) after 3 attendances.

## Phase 4: Member & Group Management
- [x] **Member CRM:** List, filter, and add new members to groups (including `phoneNumber` field).
- [x] **Group Dashboard:** View group‑specific stats and leader assignments.
- [x] **Member Profiles:** Detailed view of individual attendance history and growth.

## Phase 5: AI Analytics & Reporting
- [ ] **Reporting Engine:** Build quarterly and yearly attendance reports (time‑dimension filters, status progression, leader effectiveness).
- [ ] **AI Growth Consultant:**
  - Integrate OpenAI to analyze attendance patterns.
  - Generate insights on retention and group performance.
- [ ] **Visualizations:** Implement charts for attendance trends and group comparisons (line & pie charts).
- [x] **Reports Page UI:** Basic cards, placeholder charts, and detailed group performance table are in place.

## Phase 6: Polish & Performance
- [ ] **Mobile Optimization:** Ensure the attendance toggle is high‑performance on low‑end mobile devices.
- [x] **Error Handling:** Robust toasts and validation for attendance saves.
- [ ] **Final QA:** Test with real‑world scenarios (slow networks, large member lists).
