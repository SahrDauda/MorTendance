# Remaining Work Overview

## What I can do now
- Replace mock data with real API calls on discover, network, notifications, settings, and detail pages.
- Implement missing Next.js API routes (network, notifications, search, settings, verify QR/blockchain stubs, feed, courses) using Prisma.
- Build missing pages and wire them to APIs (messages inbox/conversation, applications UI, feed/activity, courses/insights).
- Add real-time layers (notifications and messaging) with WebSocket/EventSource patterns.
- Improve reliability and UX: consistent loading/error states, input validation, pagination, and basic caching.
- Harden security and performance: authz checks, rate limiting, structured error responses, logging/monitoring hooks.

## What I can’t do without your input but should be done
- Configure secrets and external services (`DATABASE_URL`, `NEXTAUTH_SECRET`, email/SMS providers, storage, monitoring destinations).
- Decide product/UX scope for features like blockchain verification depth, industry insights content, and search ranking rules.
- Provision and verify infrastructure (databases, Accelerate vs direct DB, CDN/storage buckets) or third-party credentials without access.
- Enable real email/SMS notifications or file uploads without the chosen providers and credentials.

