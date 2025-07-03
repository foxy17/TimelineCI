# Timeline CI

Timeline CI provides a deployment visibility dashboard for teams operating multiple microservices. It combines a Supabase backend with a Next.js frontend to track every service's state across deployment cycles.

## Features 🚀

- **Multi-tenant support** ensures each organization has isolated services and deployment data.
- **Deployment cycles** let you group releases into weekly or sprint-based batches.
- **Service dependencies** enforce deployment order so teams know when upstream services are ready.
- **Task tracking** attaches checklists to service deployments for pre-flight steps.
- **Real-time updates** keep everyone in sync as deployments progress.
- **Historical views** provide insight into past cycles and performance.

## How It Works ⚙️

1. **Supabase Database**
   - Tables manage tenants, microservices, deployment cycles, and dependencies.
   - Row-level security guarantees tenant isolation using JWT claims.
   - Database functions handle state transitions, dependency checks, and cycle creation.
2. **Next.js Frontend**
   - Dashboard pages show active cycles, individual deployment boards, and history.
   - Components subscribe to Supabase for live updates, displaying service status and tasks.
   - Modals and cards help operators start deployments, mark them complete, or reset when needed.
3. **Real-Time Visibility**
   - As deployments move from `ready` ➡️ `triggered` ➡️ `deployed`, the board updates instantly.
   - Dependency errors are surfaced early so blockers can be resolved.
   - Completed cycles remain available for auditing and retrospectives.

## Getting Started 🏁

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Configure environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Run the app**
   ```bash
   pnpm dev
   ```

## Why This Helps Teams 🤝

- **Centralized timeline** – track every microservice across cycles in one place.
- **Clear responsibilities** – tasks and dependency rules make it obvious when a service is ready to deploy.
- **Fewer surprises** – real-time updates reduce miscommunication between teams.
- **Easy retrospectives** – search past cycles to learn from previous deployments.

Together, these features bring greater visibility and confidence to organizations deploying many microservices. Happy shipping! 🚢
