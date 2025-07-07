# TimelineCI - Deployment Coordination Dashboard

TimelineCI helps development teams coordinate the deployment of multiple services in an organized, dependency-aware way. Think of it as a project management board specifically designed for software releases.

## What TimelineCI Does 📋

**For Project Managers & Team Leads:**

- Get a clear visual overview of which services are ready to deploy and which need more work
- Track deployment progress in real-time across your entire team
- Ensure critical dependencies are deployed in the right order to avoid system failures
- Review deployment history to understand team velocity and identify bottlenecks

**For Developers & DevOps:**

- Organize deployments into cycles (weekly releases, sprints, or any cadence that works for your team)
- Create checklists of pre-deployment tasks that must be completed before a service can go live
- Set up dependency relationships so services automatically wait for their dependencies
- Get instant updates when deployments start, complete, or encounter issues

**Key Workflow:**

1. **Plan** - Create a deployment cycle and add the services you want to release
2. **Prepare** - Complete pre-flight checklists and ensure dependencies are ready
3. **Deploy** - Move services through stages: Not Ready → Ready → In Progress → Deployed
4. **Track** - Monitor progress in real-time and see who deployed what when
5. **Review** - Look back at deployment history to improve future releases

## Features 🚀

- **Deployment Cycles** - Group services into release batches (weekly, sprint-based, or custom)
- **Kanban-Style Board** - Visual deployment pipeline with drag-and-drop state management
- **Dependency Management** - Services automatically wait for their dependencies to deploy first
- **Task Checklists** - Attach pre-deployment tasks to ensure nothing is forgotten
- **Real-Time Updates** - See changes instantly as team members update deployment status
- **Deployment History** - Search and filter past deployments for retrospectives and auditing
- **Team Coordination** - Multiple team members can work together with role-based access

## Technical Architecture ⚙️

**Database (Supabase):**

- PostgreSQL with row-level security for data isolation
- Real-time subscriptions for live updates across all connected users
- Database functions handle complex deployment state transitions and dependency validation
- Multi-tenant architecture supports multiple organizations (currently configured for single-org use)

**Frontend (Next.js):**

- Server-side rendering for fast initial page loads
- React components with real-time Supabase subscriptions
- Responsive design that works on desktop and mobile
- TypeScript for type safety and better developer experience

**Authentication & Access:**

- Supabase Auth handles user authentication
- Users are automatically assigned to organizations based on email domain
- Currently configured for singlegle org aplha testing

## Getting Started 🏁

### Prerequisites

- Node.js 18+ and pnpm
- Supabase project with the provided database migrations

### Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**
   Create a `.env.local` file with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up the database**
   Run the migrations in the `supabase/migrations/` directory in order

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Access the application**
   Open http://localhost:3000 and sign in with an authorized email address

## Usage Guide 📖

### Creating Your First Deployment Cycle

1. Navigate to the Dashboard
2. Click "Create New Cycle" and give it a name (e.g., "Week 1 Release", "Sprint 23")
3. Add services to the cycle from your service pool
4. Set up dependencies between services if needed
5. Add task checklists to services that require pre-deployment steps

### Managing Deployments

- **Not Ready**: Service has pending tasks or dependencies
- **Ready**: Service is prepared and can be deployed
- **In Progress**: Deployment has started
- **Deployed**: Service is live and complete

### Setting Up Dependencies

Use the dependency modal to specify which services must be deployed before others. The system will automatically prevent deployments that would break dependency order.

## Why Teams Choose TimelineCI 🤝

- **Reduces Deployment Risks** - Dependency checking prevents "deployment order" outages
- **Improves Visibility** - Everyone knows what's deploying when, reducing surprises
- **Streamlines Coordination** - No more Slack threads asking "is service X ready yet?"
- **Enables Retrospectives** - Historical data helps teams improve their deployment process
- **Scales with Teams** - Works for small teams and larger organizations with multiple services

---

_Built with Next.js, Supabase, and TypeScript. Designed for teams who deploy often and want to do it safely._
