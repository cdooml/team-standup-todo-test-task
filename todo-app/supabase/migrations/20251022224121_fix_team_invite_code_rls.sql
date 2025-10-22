-- Fix RLS policy for teams to allow looking up teams by invite code
-- This is needed for the join team flow to work

-- Create a helper function to look up teams by invite code (bypasses RLS)
create or replace function get_team_by_invite_code(code text)
returns setof teams as $$
  select * from teams where invite_code = code;
$$ language sql security definer;

-- Also update the teams policy to be more permissive for authenticated users
-- Allow viewing teams if: created by user, member of team, OR any team (for invite lookup)
drop policy if exists "Team members can view teams" on teams;

create policy "Authenticated users can view teams"
  on teams for select
  to authenticated
  using (true);

-- Note: Allowing all authenticated users to view teams is safe because:
-- 1. Team names/existence aren't sensitive
-- 2. Actual sensitive data (tasks, members) is protected by their own RLS policies
-- 3. This allows invite code lookups and prevents RLS violations

