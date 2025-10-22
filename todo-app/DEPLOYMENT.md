# Deployment Guide - Team Standup Todo

This guide walks you through deploying your Team Standup Todo app to Vercel.

## Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub account
- [ ] A Vercel account (free tier is fine)
- [ ] A Supabase project set up with the database schema
- [ ] Your Supabase credentials ready

## Step 1: Prepare Your Supabase Project

### 1.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name:** team-standup-todo (or your choice)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
5. Wait 2-3 minutes for project initialization

### 1.2 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project
4. Paste into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Verify tables were created in **Database > Tables**

### 1.3 Enable Realtime

1. Go to **Database > Replication**
2. Find and enable these tables:
   - `tasks`
   - `presence`
   - `team_members`
3. Toggle "Enable Replication" for each table

### 1.4 Get Your Credentials

1. Go to **Settings > API**
2. Copy these values (you'll need them in Step 3):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 1.5 Configure Email Auth

1. Go to **Authentication > Providers**
2. Enable "Email" provider
3. Disable "Confirm email" (for faster testing, enable in production)
4. Go to **Authentication > URL Configuration**
5. Add these URLs (replace with your domain):
   ```
   Site URL: https://your-app.vercel.app
   Redirect URLs: https://your-app.vercel.app/**
   ```
   (You'll update this after deploying)

## Step 2: Prepare Your Code

### 2.1 Commit Your Code

```bash
cd todo-app
git add .
git commit -m "Initial commit: Team Standup Todo"
```

### 2.2 Push to GitHub

If you haven't already:

```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/yourusername/team-standup-todo.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." > "Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js

### 3.2 Configure Project

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `todo-app`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)

### 3.3 Add Environment Variables

Click "Environment Variables" and add these:

| Name                            | Value                       | Where to find                            |
| ------------------------------- | --------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxxx.supabase.co` | Supabase > Settings > API                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...`               | Supabase > Settings > API (anon public)  |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGci...`               | Supabase > Settings > API (service_role) |

**Important:**

- Make sure to add these to **Production**, **Preview**, and **Development**
- The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client

### 3.4 Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Vercel will give you a URL: `https://your-app.vercel.app`

## Step 4: Configure Supabase with Vercel URL

### 4.1 Update Site URL

1. Copy your Vercel deployment URL
2. Go to Supabase > **Authentication > URL Configuration**
3. Update:
   ```
   Site URL: https://your-app.vercel.app
   ```
4. Add to Redirect URLs:
   ```
   https://your-app.vercel.app/**
   ```

### 4.2 Test Email Auth

1. Visit your Vercel URL
2. Try signing in with your email
3. Check your inbox for the magic link
4. Click the link - it should redirect to your Vercel app

## Step 5: Test Everything

### 5.1 Basic Flow

- [ ] Visit `/login` and send magic link
- [ ] Click email link and authenticate
- [ ] Create a team
- [ ] Add a task to Today column
- [ ] Drag task to Yesterday
- [ ] Mark task as done
- [ ] Delete task

### 5.2 Real-time Test

- [ ] Open app in two browser tabs
- [ ] Add task in one tab
- [ ] Verify it appears in other tab (within 1 second)
- [ ] Drag task in one tab
- [ ] Verify it moves in other tab

### 5.3 Team Features

- [ ] Create a team and get invite code
- [ ] Open incognito/private window
- [ ] Sign in with different email
- [ ] Join team with invite code
- [ ] Add tasks from both accounts
- [ ] Verify real-time updates work

## Step 6: Optional Enhancements

### 6.1 Custom Domain

1. In Vercel project settings, go to **Domains**
2. Add your custom domain (e.g., `standup.yoursite.com`)
3. Follow Vercel's DNS instructions
4. Update Supabase URL Configuration with new domain

### 6.2 Analytics

1. In Vercel project, go to **Analytics**
2. Enable Web Analytics (free)
3. Track page views, performance, etc.

### 6.3 Environment-Specific Configs

Create separate Supabase projects for:

- **Production:** Main app
- **Preview:** PR deployments (Vercel auto-creates)
- **Development:** Local dev

## Troubleshooting

### "Invalid redirect URL" error

**Cause:** Vercel URL not added to Supabase Redirect URLs  
**Fix:** Add `https://your-app.vercel.app/**` to Supabase > Auth > URL Configuration

### Magic link not working

**Cause:** Email rate limiting or wrong Site URL  
**Fix:**

1. Check Supabase > Auth > URL Configuration matches Vercel URL
2. Check email spam folder
3. Wait 60 seconds between magic link requests

### Real-time not working

**Cause:** Realtime not enabled on tables  
**Fix:** Enable replication for `tasks`, `presence`, `team_members` in Database > Replication

### "RLS policy violation" error

**Cause:** User not in team_members table  
**Fix:**

1. Check team membership exists in database
2. Verify RLS policies are correctly set up
3. Try disabling RLS temporarily to debug (re-enable after!)

### Build fails on Vercel

**Cause:** Missing dependencies or TypeScript errors  
**Fix:**

1. Run `npm run build` locally first
2. Fix any TypeScript errors
3. Ensure all dependencies are in `package.json`
4. Check Vercel build logs for specific errors

## Monitoring & Maintenance

### Performance Monitoring

- Use Vercel Analytics to track Core Web Vitals
- Monitor real-time connection count in Supabase (free tier: 200 concurrent)
- Check database size (free tier: 500MB)

### Database Backups

Supabase Pro includes automatic backups. On free tier:

1. Use Supabase CLI: `supabase db dump`
2. Run weekly and store in version control
3. Or upgrade to Supabase Pro for automatic backups

### Scaling Considerations

**Free Tier Limits:**

- Supabase: 500MB database, 200 concurrent realtime connections
- Vercel: 100GB bandwidth, unlimited deployments

**When to upgrade:**

- More than 50 active users simultaneously → Upgrade Supabase
- More than 1000 daily active users → Consider Supabase Pro
- High traffic (>100GB/month) → Vercel Pro

## Security Checklist

Before going live with real users:

- [ ] Enable email confirmation in Supabase Auth
- [ ] Set up rate limiting on magic link requests
- [ ] Review RLS policies for security holes
- [ ] Enable Supabase Vault for secure secret storage
- [ ] Add CAPTCHA to login form (prevent spam)
- [ ] Set up error monitoring (Sentry)
- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Review Vercel security headers

## Next Steps

After successful deployment:

1. **Share with team** - Get your colleagues to test it
2. **Gather feedback** - Use Vercel Analytics to see usage patterns
3. **Iterate** - Add features based on real usage
4. **Scale** - Monitor performance and upgrade as needed

## Support

- **Vercel Docs:** [https://vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [https://nextjs.org/docs](https://nextjs.org/docs)

---

**Congratulations!** Your Team Standup Todo app is now live! 🎉

Share your deployment URL in your job application to showcase:

- AI-augmented development velocity
- Full-stack Next.js proficiency
- Real-time architecture understanding
- Production deployment experience

**You ship, therefore you are.** 🚀
