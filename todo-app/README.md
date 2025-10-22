# Team Standup Todo

A real-time, collaborative task board designed to replace boring async standups with an interactive experience.

## 🚀 Features

### Core Functionality

- **Yesterday/Today/Blockers Columns** - Organize tasks by standup format
- **Real-time Updates** - See teammate progress live across all connected clients
- **Team Workspaces** - Create multiple teams with invite codes
- **Drag & Drop** - Move tasks between columns seamlessly
- **Online Presence** - See who's online and actively working
- **Magic Link Auth** - Passwordless authentication via email

### User Experience

- **Keyboard Shortcuts** - Press `/` to quickly add tasks
- **Optimistic UI** - Instant feedback with automatic reconciliation
- **Status Indicators** - Mark tasks as pending, in progress, or done
- **Inline Editing** - Click task titles to edit directly
- **Animations** - Smooth transitions and visual feedback
- **Dark Mode** - Full dark mode support
- **Responsive** - Works beautifully on desktop and mobile

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Database & Auth:** Supabase (PostgreSQL + Real-time + Auth)
- **UI Components:** Shadcn UI
- **Styling:** TailwindCSS 4
- **Drag & Drop:** @dnd-kit
- **State Management:** React Server Components + Optimistic Updates
- **Deployment:** Vercel

## 📦 Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. **Clone and Install**

```bash
cd todo-app
npm install
```

2. **Set up Supabase**

   - Create a Supabase project
   - Run the SQL migration from `supabase-schema.sql`
   - Enable realtime on `tasks`, `presence`, and `team_members` tables

3. **Configure Environment**

```bash
cp .env.local.example .env.local
# Add your Supabase credentials
```

4. **Run Development Server**

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 🎯 Architecture Highlights

### Server Components Strategy

- Data fetching happens on the server
- RLS policies enforce security at the database level
- Initial page loads are fast and SEO-friendly

### Real-time Architecture

- Supabase Realtime for instant updates across clients
- Presence tracking shows who's online
- Optimistic UI updates for perceived performance

### Security

- Row Level Security (RLS) policies on all tables
- Team-based access control
- Server-only API keys never exposed to client

## 🎨 Key Files

```
todo-app/
├── app/
│   ├── (auth)/login/          # Magic link authentication
│   ├── (dashboard)/           # Protected dashboard routes
│   │   └── team/[teamId]/     # Team standup board
│   └── auth/callback/         # Auth callback handler
├── components/
│   ├── standup-board.tsx      # Main board orchestrator
│   ├── task-card.tsx          # Individual task with drag support
│   ├── task-form.tsx          # Quick add form
│   ├── team-selector.tsx      # Team switcher
│   └── presence-indicator.tsx # Online users display
├── lib/
│   ├── supabase/              # Supabase client/server utilities
│   └── hooks/                 # Real-time & presence hooks
├── actions/
│   ├── tasks.ts               # Task CRUD server actions
│   └── teams.ts               # Team management actions
└── types/
    └── database.types.ts      # TypeScript types from Supabase
```

## 🔐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=       # Server-only service key
```

## 📝 Usage

### Creating a Team

1. Click "Teams" dropdown in header
2. Select "Create team"
3. Enter team name
4. Share the invite code with teammates

### Adding Tasks

- Click "Add task" button or press `/`
- Type task title
- Select section (Yesterday/Today/Blockers)
- Press Enter to add

### Managing Tasks

- **Move:** Drag and drop between columns
- **Edit:** Click task title to edit inline
- **Complete:** Check the checkbox
- **Delete:** Hover over your tasks and click trash icon

### Inviting Team Members

- Share your team's invite code (shown on team page)
- Members click "Teams" > "Join team"
- Enter invite code to join instantly

## 🚀 Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/team-standup-todo)

Or manually:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Don't forget to update Supabase's Site URL and Redirect URLs to include your Vercel URL.

## 🧪 Development

### Running Locally

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Database Migrations

After modifying the schema:

1. Update `supabase-schema.sql`
2. Run in Supabase SQL editor
3. Regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_REF > types/database.types.ts
```

## 🎯 Roadmap

- [ ] Task assignments
- [ ] Task comments
- [ ] File attachments
- [ ] Task templates
- [ ] Weekly summaries
- [ ] Slack/Discord integration
- [ ] Mobile app (React Native)

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [@dnd-kit](https://dndkit.com/)

---

**Built for a job interview to demonstrate AI-augmented shipping velocity.**

See `PROMPTS_USED.md` for all AI prompts used in development.
