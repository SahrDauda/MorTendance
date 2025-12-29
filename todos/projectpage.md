*** Begin Patch
*** Update File: todos/projectpage.md
@@
-# MVP Steps Remaining
+## Projects Page – Ready-to-Ship Plan (Inclusive, Cross-Discipline)
+
+### Objective
+Publish and browse projects from any profession (tech, creative, business, trades, research, non-profit) with evidence, impact, and trust signals.
+
+### Scope
+- Create/update projects
+- View project detail
+- List + filters
+- Evidence (media/links)
+- Endorsements and basic verification
+
+### UX & Content
+- Inclusive copy: “Share your work—software, design, research, events, services, products, builds, community projects.”
+- Required fields: title, category, summary/description, start date.
+- Optional fields: end date, role, organization/client, location, visibility (public/private/connections), impact metrics, evidence links, media uploads, collaborators, tags/skills.
+- Categories (examples): Software, Design/Creative, Business/Entrepreneurship, Research/Academic, Trades/Crafts, Non-profit/Community, Education/Training, Health/Wellness, Media/Content, Product/Hardware.
+- Templates by category (helper text in form):
+  - Research: problem/hypothesis, method, results, citation/DOI
+  - Non-profit/Community: problem, intervention, beneficiaries, outcomes
+  - Design/Creative: brief, process, deliverable, audience
+  - Business: goal, market, traction/revenue, KPIs
+  - Trades/Crafts: materials, safety/compliance, before/after
+- Empty state: “Share any project—films, apps, reports, events, products, courses, builds.”
+- Cards: show category badge, role/org, impact snippet (e.g., “Reached 2,000 people”, “-15% cost”).
+- Detail layout: Overview, Process, Impact, Evidence/Media, Skills & Tags, Collaborators, Endorsements, Actions (verify/report).
+
+### Data Model (Prisma additions)
+- `category` (enum/string)
+- `tags` (string[]; freeform)
+- `impactMetrics` (Json) — e.g., { audience: 2000, revenue: 12000, satisfaction: 4.6, currency: "USD", notes: "Reduced downtime 15%" }
+- `evidenceLinks` (string[]) — URLs to videos, reports, press, papers
+- (Optional) `location` (string)
+- Media remains via `project_media`; collaborators remain as-is.
+
+### API changes
+- Update POST/PUT `/api/projects` to accept `category`, `tags`, `impactMetrics`, `evidenceLinks`, `location`.
+- Validate: title, description, category required; arrays length-limited; URLs validated.
+- Response: include new fields in list/detail.
+- Filters on GET `/api/projects`:
+  - `category`, `tags`, `hasImpact=true`, `hasMedia=true`, `q` (search title/description/tags/category).
+
+### Frontend changes
+- Form: add category select, tags input (freeform chips), optional impact/evidence sections (collapsible).
+- Helper text panel changes dynamically per category.
+- List page filters: category dropdown, search, tags, impact toggle.
+- Cards: show category badge, impact snippet, evidence/attachments count.
+- Detail page: new sections for Impact (metrics table) and Evidence (link list).
+- Error/loading states aligned with existing design system.
+
+### Trust & Safety
+- Endorsements: allow non-tech endorsers (clients, mentors, peers).
+- Evidence-first prompts (photos, reports, testimonials).
+- Optional “submitted for verification” flag (reuses verification_requests later).
+- Basic reporting hook (stub) for inappropriate content.
+
+### Validation & Limits
+- Title ≤ 100 chars, description ≤ 2000, tags ≤ 15, evidenceLinks ≤ 10, max media size per existing upload policy.
+- Safe HTML/markdown: sanitize descriptions if rich text is added later.
+
+### Rollout
+1) Backend: schema + API params + filters.  
+2) Frontend: form/UI updates, cards, detail sections.  
+3) QA: create across categories, filter/search, evidence/impact display.  
+4) Seed examples: at least one per category to showcase inclusivity.
+
+### Success Metrics
+- % of new projects from non-tech categories
+- Evidence attachment rate
+- Completion rate of project submissions
+- Views and endorsements per category
*** End Patch