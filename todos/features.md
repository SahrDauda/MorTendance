# Feature Implementation Status (Explicit Checklist)

Legend: ✅ = done, ❌ = not done/partial

## Network System
- Status: ❌
- Definition: Connect with people, send/accept requests, see suggestions.
- How it will work: Users view connections, browse suggested people, send/accept/decline requests; badges show pending counts.
- Implementation steps:
  - API: `GET /api/network/connections`, `GET /api/network/suggestions`, `GET/POST /api/network/requests`, accept/decline routes.
  - UI: Wire `/network`, `/network/find`, `/network/requests` to these endpoints with mutations + optimistic updates.
  - Optional: websocket/event updates for new requests and status changes.

## Notifications System
- Status: ❌
- Definition: In-app alerts for requests, messages, applications, and updates.
- How it will work: Badge counts in header; list view with read/unread; click to navigate; mark-as-read individually or all.
- Implementation steps:
  - API: `GET /api/notifications`, `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`.
  - UI: Fetch list, render unread state, hook mark-as-read to mutations; update badge counts.
  - Optional: websocket/event stream for live delivery.

## Search (Global/People/Skills/Opportunities)
- Status: ❌
- Definition: Cross-entity search with filters and relevance ranking.
- How it will work: Single search box with tabs/filters; debounced queries; results list with entity-specific cards.
- Implementation steps:
  - API: `/api/search` supporting entity filters (users/skills/opportunities).
  - UI: Update Discover + Network Find to call search API; add debounced input, empty/error/loading states.
  - Ranking: simple text search first, later add weighting by demand/match.

## Settings Persistence
- Status: ❌
- Definition: User preferences and account controls (notifications, privacy, deletion).
- How it will work: Settings form saves to DB; confirmation for delete account.
- Implementation steps:
  - API: `GET/PUT /api/users/settings`, `POST /api/users/delete`.
  - UI: Wire `/settings` to fetch/save; add delete flow with confirmation and sign-out.

## Messaging
- Status: ❌
- Definition: Direct conversations with thread history and new message delivery.
- How it will work: Inbox shows conversations; thread view shows messages; send box with typing/optimistic append; real-time/polling refresh.
- Implementation steps:
  - API: `/api/messages` (list conversations), `/api/messages/[id]` (thread), POST send.
  - UI: Pages `/messages` and `/messages/[id]`; add polling or websocket for new messages.

## Verify / Credentials Enhancements
- Status: ❌
- Definition: Verifiable credentials with QR and optional blockchain proof.
- How it will work: Verify page shows credential status; QR links to verification endpoint; optional on-chain hash check.
- Implementation steps:
  - API: `/api/credentials/[id]/verify`, `/qr`, `/blockchain` (stub or real).
  - UI: Update `/verify` to fetch status, render QR, display verification result.

## Applications UI
- Status: ❌
- Definition: View job application history and statuses.
- How it will work: Applications page lists submissions with status, role, company, date; links to opportunity.
- Implementation steps:
  - UI: Build `/applications` dashboard page.
  - Data: Use existing `/api/applications` endpoints; add filtering/sorting.

## Feed / Activity
- Status: ❌
- Definition: Activity stream (connections, credentials, projects, insights).
- How it will work: Feed page showing recent events; may include insights cards.
- Implementation steps:
  - API: `/api/feed`, `/api/feed/insights`.
  - UI: Create `/feed` page rendering events with timestamps; add pagination/infinite scroll.

## Courses / Learning
- Status: ❌
- Definition: Course catalog and recommendations tied to career paths.
- How it will work: Courses page lists items with tags; recommendations surface on dashboard/discover.
- Implementation steps:
  - API: `/api/courses`, `/api/courses/recommendations`.
  - UI: Create `/courses` page; add “recommended” module elsewhere.

## Industry Insights Content
- Status: ❌
- Definition: Curated insights and market trends.
- How it will work: Insights cards/section pulling from API or content store; dates and categories shown.
- Implementation steps:
  - Content: Add service/API or static JSON for insights.
  - UI: Wire Discover/Insights sections to real data.

## Real-Time Layers
- Status: ❌
- Definition: Live updates for notifications and messaging.
- How it will work: Header badges and threads update without refresh.
- Implementation steps:
  - Backend: websocket or EventSource endpoints; publish on new notifications/messages.
  - Frontend: subscribe client-side; merge incoming events into state.

## File Uploads for Project Media
- Status: ❌
- Definition: Upload and attach media to projects.
- How it will work: File picker -> signed upload -> stored URL saved with project; preview in UI.
- Implementation steps:
  - Integrate storage provider (S3/GCS/etc.), signed uploads, and URL persistence.
  - Update project forms to accept uploads and save URLs.

