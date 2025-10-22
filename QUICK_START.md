# Quick Start Guide - Team Standup Todo

Get your app running in 10 minutes! ⚡

## Step 1: Set Up Supabase (5 minutes)

1. **Create Project**

   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization, name it, generate password
   - Wait 2 minutes for initialization

2. **Run Migration**

   - Open SQL Editor in Supabase dashboard
   - Copy/paste contents of `todo-app/supabase-schema.sql`
   - Click "Run" (Cmd/Ctrl + Enter)
   - Verify tables created in Database > Tables

3. **Enable Realtime**

   - Go to Database > Replication
   - Enable for: `tasks`, `presence`, `team_members`

4. **Get Credentials**
   - Settings > API
   - Copy: Project URL, anon key, service_role key

## Step 2: Run Locally (3 minutes)

1. **Install Dependencies**

   ```bash
   cd todo-app
   npm install
   ```

2. **Configure Environment**

   ```bash
   # Create .env.local file
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Visit [http://localhost:3000](http://localhost:3000)
   - You're running! 🎉

## Step 3: First Login (2 minutes)

1. Click "Send magic link"
2. Enter your email
3. Check inbox (might be in spam)
4. Click link to authenticate
5. Create your first team
6. Add a task by pressing `/`

## Test Real-time

1. Open app in two browser tabs
2. Add task in one tab
3. Watch it appear instantly in the other! ✨

## Deploy to Vercel (Optional)

See `DEPLOYMENT.md` for full instructions.

Quick version:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## Troubleshooting

**Magic link not working?**

- Check spam folder
- Verify Site URL in Supabase > Auth > URL Configuration is `http://localhost:3000`

**Real-time not working?**

- Ensure realtime enabled on tables
- Check browser console for errors

**Build errors?**

- Run `npm install` again
- Check Node.js version (need 18+)

## Next Steps

- Invite teammates to test
- Check out the features (drag-and-drop, presence, etc.)
- Read SETUP.md for detailed documentation
- Deploy to Vercel when ready

---

**Need help?** Check SETUP.md and DEPLOYMENT.md for detailed guides.

**Want to customize?** All code is well-documented and easy to modify.

**Ready to ship?** Follow DEPLOYMENT.md to go live!

🚀 **Happy shipping!**
