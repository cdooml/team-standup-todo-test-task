<!-- 85d44ac1-10d6-40b2-8280-f2326e88e39b 8dd819e5-df85-4e45-be69-8051e45887ac -->
# Team Standup Todo App - Implementation Plan

## 1. Architecture Decisions

### App Router Structure

```
todo-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Magic link login
│   │   └── auth/callback/route.ts  # Supabase auth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Server Component: fetch user, teams
│   │   ├── page.tsx                # Redirect to first team
│   │   └── team/[teamId]/
│   │       └── page.tsx            # Main standup board
│   ├── api/
│   │   └── tasks/route.ts          # Optional API routes for mutations
│   └── layout.tsx                  # Root with Supabase provider
├── components/
│   ├── ui/                         # Shadcn components
│   ├── standup-board.tsx           # Client: Real-time board
│   ├── task-card.tsx               # Client: Draggable task
│   ├── task-form.tsx               # Client: Quick add form
│   ├── presence-indicator.tsx      # Client: Online users
│   └── team-selector.tsx           # Client: Team dropdown
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase
│   │   ├── server.ts               # Server-side Supabase
│   │   └── middleware.ts           # Auth middleware
│   ├── hooks/
│   │   ├── use-realtime-tasks.ts   # Realtime subscription
│   │   └── use-presence.ts         # Presence tracking
│   └── utils.ts                    # cn() helper, etc.
└── types/
    └── database.types.ts           # Generated from Supabase
```

### Server vs Client Strategy

- **Server Components**: Data fetching (user, teams, initial tasks), RLS enforcement
- **Client Components**: All interactions, real-time subscriptions, drag-and-drop
- **Server Actions**: Task mutations (create, update, delete, move)
- **Optimistic UI**: Immediate feedback, reconcile on subscription updates

### State Management

- React Server Components for initial data
- Client state via `useState` + Zustand (lightweight store for tasks)
- Supabase Realtime for sync across clients
- No Redux needed - keep it simple

## 2. Database Schema (DBML)

```dbml
Table profiles {
  id uuid [pk, ref: > auth.users.id]
  email text [not null]
  full_name text
  avatar_url text
  created_at timestamp [default: `now()`]
  
  indexes {
    email [unique]
  }
}

Table teams {
  id uuid [pk, default: `gen_random_uuid()`]
  name text [not null]
  invite_code text [unique, not null] // For easy team joining
  created_by uuid [ref: > profiles.id]
  created_at timestamp [default: `now()`]
  
  indexes {
    invite_code [unique]
  }
}

Table team_members {
  id uuid [pk, default: `gen_random_uuid()`]
  team_id uuid [ref: > teams.id, not null]
  user_id uuid [ref: > profiles.id, not null]
  role text [default: 'member'] // 'admin' | 'member'
  joined_at timestamp [default: `now()`]
  
  indexes {
    (team_id, user_id) [unique]
  }
}

Table tasks {
  id uuid [pk, default: `gen_random_uuid()`]
  team_id uuid [ref: > teams.id, not null]
  user_id uuid [ref: > profiles.id, not null]
  title text [not null]
  description text
  section text [not null] // 'yesterday' | 'today' | 'blockers'
  status text [default: 'pending'] // 'pending' | 'in_progress' | 'done'
  position int [not null, default: 0] // For ordering within section
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  indexes {
    (team_id, section, position)
    (user_id)
  }
}

Table presence {
  id uuid [pk, default: `gen_random_uuid()`]
  team_id uuid [ref: > teams.id, not null]
  user_id uuid [ref: > profiles.id, not null]
  last_seen timestamp [default: `now()`]
  
  indexes {
    (team_id, user_id) [unique]
    (last_seen) // For cleanup of stale presence
  }
}
```

## 3. Authentication Flow

### Magic Link Flow

1. User enters email on `/login`
2. Supabase sends magic link via email
3. User clicks link → redirects to `/auth/callback` → creates session
4. Check if user has profile, create if not
5. Redirect to `/` (dashboard)

### RLS Policies

```sql
-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Teams: Members can read, creators can update
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = id AND user_id = auth.uid()
    )
  );

-- Tasks: Team members can CRUD their team's tasks
CREATE POLICY "Team members can view tasks"
  ON tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = tasks.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = tasks.team_id AND user_id = auth.uid()
    )
  );

-- Similar for UPDATE/DELETE
```

### Team Invitation

- Generate unique `invite_code` on team creation (nanoid or short UUID)
- Share link: `app.com/invite/ABC123`
- Route handler validates code, adds user to `team_members`

## 4. Real-time Strategy

### Broadcast Channel for Tasks

```ts
// In use-realtime-tasks.ts
const channel = supabase.channel(`team:${teamId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `team_id=eq.${teamId}`
  }, (payload) => {
    // Update local state based on event type
    handleTaskChange(payload)
  })
  .subscribe()
```

### Presence for Online Indicators

```ts
// In use-presence.ts
const channel = supabase.channel(`presence:${teamId}`, {
  config: { presence: { key: userId } }
})
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    setOnlineUsers(Object.keys(state))
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ 
        user_id: userId, 
        online_at: new Date().toISOString() 
      })
    }
  })
```

### Subscription Management

- Subscribe on component mount
- Unsubscribe on unmount
- Handle reconnection logic (Supabase does this automatically)

## 5. Component Architecture

### Server Components (Data Fetching)

- `app/(dashboard)/layout.tsx`: Fetch user profile, teams
- `app/(dashboard)/team/[teamId]/page.tsx`: Fetch initial tasks, team members
  - Pass as props to client components
  - Enables Server Component caching

### Client Components (Interactivity)

**`<StandupBoard />` (Main orchestrator)**

- Manages 3 columns: Yesterday, Today, Blockers
- Subscribes to real-time task updates
- Handles drag-and-drop between columns
- Optimistic UI for mutations

**`<TaskCard />` (Individual task)**

- Draggable via `@dnd-kit/core`
- Inline editing (click to edit title)
- Status toggle (pending → in_progress → done)
- User avatar indicator

**`<TaskForm />` (Quick add)**

- Autofocus on "/" keyboard shortcut
- Dropdown to select section (default: today)
- Enter to submit, Esc to cancel

**`<PresenceIndicator />` (Online users)**

- Avatar stack of online team members
- Green dot for online, gray for offline

**`<TeamSelector />` (Dropdown)**

- Switch between teams
- "Create team" and "Join team" actions

### Optimistic UI Pattern

```ts
async function moveTask(taskId: string, newSection: string) {
  // 1. Optimistic update
  setTasks(prev => prev.map(t => 
    t.id === taskId ? { ...t, section: newSection } : t
  ))
  
  // 2. Actual mutation (Server Action)
  const { error } = await updateTaskSection(taskId, newSection)
  
  // 3. Error handling (revert on failure)
  if (error) {
    setTasks(prev => /* revert */)
    toast.error('Failed to move task')
  }
  
  // 4. Real-time subscription will reconcile
}
```

## 6. Edge Cases to Handle

### Offline State

- Show toast notification when connection lost
- Queue mutations, retry on reconnect (or keep simple: just show error)
- Disable drag-and-drop when offline

### Concurrent Edits

- Last-write-wins (Supabase default)
- Real-time subscription ensures all clients converge
- Optimistic UI may briefly show conflict, then reconcile

### Team Permissions

- RLS enforces team membership
- UI hides admin actions (delete team, remove members) for non-admins
- Graceful error messages if RLS blocks action

### Empty States

- "No tasks yet - press / to add one" with illustration
- "No team members - invite your team!" with invite link
- "No teams - create or join one" on dashboard

## 7. UX Enhancements

### Keyboard Shortcuts

- `/` - Focus task input
- `j/k` - Navigate tasks up/down
- `Enter` - Open focused task for editing
- `Esc` - Close modals/cancel editing
- `1/2/3` - Jump to Yesterday/Today/Blockers column

### Drag-and-Drop

- Use `@dnd-kit/core` for smooth DnD
- Visual feedback: drop zones highlight on hover
- Snap animations when dropping
- Touch support for mobile

### Task Completion Animations

- Checkmark animation on status → done
- Confetti effect for completing blocker (micro-delight)
- Task card fades out after 1s if marked done in Yesterday

### Loading States

- Skeleton loaders for task cards (Suspense + loading.tsx)
- Spinner on mutation actions
- Shimmer effect while subscribing to realtime

### Visual Polish

- Smooth transitions (Framer Motion for animations)
- Glassmorphic cards with subtle shadows
- Color-coded sections:
  - Yesterday: Blue/gray tones
  - Today: Green/vibrant
  - Blockers: Red/orange
- Dark mode support (TailwindCSS dark: variants)

## 8. Deployment Strategy

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-only
```

### Supabase Project Setup

1. Create project on Supabase
2. Run migrations (from schema above)
3. Enable Realtime on `tasks` and `presence` tables
4. Configure email templates for magic links
5. Set up RLS policies
6. Generate TypeScript types: `npx supabase gen types typescript --project-id xxx > types/database.types.ts`

### Vercel Deployment

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy from `main` branch
4. Enable automatic deployments
5. Custom domain (optional): `standup.yourname.com`

### Post-Deployment Checklist

- Test magic link auth in production
- Verify real-time updates work across tabs/devices
- Check RLS policies prevent unauthorized access
- Test invite code flow
- Performance audit (Lighthouse score)

## 9. Implementation Order (Priority)

### Phase 1: Foundation (30 min)

1. Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `shadcn-ui` init
2. Set up Supabase client/server utilities
3. Create database schema in Supabase
4. Set up basic auth layout and login page

### Phase 2: Core Features (90 min)

5. Build dashboard layout (team selector, profile)
6. Create standup board with 3 columns
7. Implement task CRUD (Server Actions)
8. Add real-time subscriptions
9. Build task card component with status toggle

### Phase 3: Real-time & Team (60 min)

10. Implement presence tracking
11. Add team creation and invite system
12. Build team member avatars + online indicators
13. Add optimistic UI to task mutations

### Phase 4: UX Polish (45 min)

14. Implement drag-and-drop with `@dnd-kit`
15. Add keyboard shortcuts
16. Create empty states
17. Add loading skeletons and transitions
18. Dark mode refinement

### Phase 5: Deployment (15 min)

19. Set up Vercel project
20. Configure environment variables
21. Deploy and test in production
22. Create PROMPTS_USED.md with all AI conversations

## 10. Key Files to Create

### Dependencies to Install

```bash
npm install @supabase/supabase-js @supabase/ssr
npx shadcn@latest init
npx shadcn@latest add button card input label dropdown-menu avatar toast
npm install @dnd-kit/core @dnd-kit/sortable zustand nanoid
npm install framer-motion lucide-react
```

### Core Files

- `lib/supabase/client.ts` - Client-side Supabase
- `lib/supabase/server.ts` - Server-side Supabase with cookies
- `lib/supabase/middleware.ts` - Auth middleware
- `app/(auth)/login/page.tsx` - Magic link login UI
- `app/(dashboard)/layout.tsx` - Fetch user + teams
- `app/(dashboard)/team/[teamId]/page.tsx` - Main board
- `components/standup-board.tsx` - Board orchestrator
- `components/task-card.tsx` - Individual task
- `components/task-form.tsx` - Quick add form
- `hooks/use-realtime-tasks.ts` - Real-time subscription
- `hooks/use-presence.ts` - Presence tracking
- `actions/tasks.ts` - Server Actions for mutations
- `types/database.types.ts` - Generated from Supabase

## Success Metrics

- Real-time updates within 200ms across clients
- Page load under 1s (Server Components + streaming)
- Zero CLS (Cumulative Layout Shift)
- 90+ Lighthouse score
- All features working on mobile

### To-dos

- [ ] Install Supabase dependencies and initialize client/server utilities
- [ ] Initialize Shadcn UI and install core components (button, card, input, etc)
- [ ] Create database schema in Supabase (profiles, teams, team_members, tasks, presence) with RLS policies
- [ ] Build authentication flow (magic link login, callback, auth middleware)
- [ ] Create dashboard layout with team selector and user profile (Server Component)
- [ ] Build standup board with 3 columns (Yesterday/Today/Blockers) and initial task display
- [ ] Implement task CRUD operations using Server Actions
- [ ] Add real-time subscriptions for task updates across clients
- [ ] Implement presence tracking to show online team members
- [ ] Build team creation, invite system, and team switching
- [ ] Add drag-and-drop functionality between columns using @dnd-kit
- [ ] Implement keyboard shortcuts (/, j/k navigation, etc)
- [ ] Add animations, loading states, empty states, and dark mode refinements
- [ ] Deploy to Vercel with environment variables and production testing
- [ ] Create PROMPTS_USED.md documenting all AI interactions and decisions