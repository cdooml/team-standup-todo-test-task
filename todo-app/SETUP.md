# Team Standup Todo - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- Vercel account for deployment (optional but recommended)

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and wait for initialization

### 1.2 Run Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste and run the SQL migration
4. This will create all tables, RLS policies, and enable realtime

### 1.3 Enable Realtime (if not auto-enabled)

1. Go to Database > Replication
2. Enable realtime for these tables:
   - `tasks`
   - `presence`
   - `team_members`

### 1.4 Get API Credentials

1. Go to Settings > API
2. Copy these values:
   - Project URL
   - `anon` public key
   - `service_role` secret key (server-only, never expose to client)

## Step 2: Local Development Setup

### 2.1 Clone and Install

```bash
cd todo-app
npm install
```

### 2.2 Environment Variables

Create a `.env.local` file in the `todo-app` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual Supabase credentials from Step 1.4.

### 2.3 Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Step 3: First Login & Testing

### 3.1 Configure Email Auth

1. In Supabase dashboard, go to Authentication > Email Templates
2. Customize the magic link email (optional)
3. Make sure Site URL is set to `http://localhost:3000` for local dev

### 3.2 Test the Flow

1. Go to `/login`
2. Enter your email
3. Check your inbox for magic link
4. Click link to authenticate
5. You'll be redirected to the dashboard

### 3.3 Create Your First Team

1. Click "Teams" dropdown in header
2. Select "Create team"
3. Enter a team name
4. You'll be redirected to your team's standup board

### 3.4 Invite Team Members

1. Share the invite code shown on the team page
2. Team members click "Teams" > "Join team"
3. Enter the invite code
4. They're added to the team instantly

## Step 4: Vercel Deployment

### 4.1 Connect to Vercel

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 4.2 Configure Environment Variables

In Vercel project settings, add the same environment variables from Step 2.2:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4.3 Update Supabase Site URL

1. In Supabase dashboard, go to Authentication > URL Configuration
2. Add your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
3. Add it to both "Site URL" and "Redirect URLs"

### 4.4 Deploy!

- Vercel will auto-deploy from your main branch
- Every push triggers a new deployment
- Preview deployments for pull requests are created automatically

## Features Checklist

After setup, verify these features work:

- [ ] Magic link authentication
- [ ] Create a team
- [ ] Join a team with invite code
- [ ] Add tasks to Yesterday/Today/Blockers
- [ ] Drag tasks between columns
- [ ] Edit task titles (click on them)
- [ ] Mark tasks as done
- [ ] Delete your own tasks
- [ ] See real-time updates (open in two tabs)
- [ ] See online presence indicators
- [ ] Keyboard shortcut: `/` to add task
- [ ] Sign out

## Troubleshooting

### Magic Link Not Working

- Check email spam folder
- Verify Site URL in Supabase matches your app URL
- Check email rate limits in Supabase dashboard

### Real-time Not Working

- Ensure realtime is enabled for tables in Supabase
- Check browser console for WebSocket errors
- Verify RLS policies allow your user to read tasks

### RLS Policy Errors

- Common issue: User not in `team_members` table
- Solution: Check team membership exists
- Debug: Temporarily disable RLS to isolate issue (re-enable after!)

### Type Errors

- If you modify database schema, regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```

## Development Tips

### Hot Reload Issues

- Next.js 16 may require hard refresh for some changes
- Restart dev server if hooks don't update

### Database Changes

- Always update `supabase-schema.sql` with new migrations
- Test RLS policies thoroughly before deploying

### Performance

- Use Supabase's built-in caching where possible
- Monitor real-time connection count (free tier limits apply)

## Support

- Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)
- Open an issue on GitHub for bugs

---

**Built with:** Next.js 16, Supabase, Shadcn UI, TailwindCSS 4, @dnd-kit
