-- Fix RLS policy for team_members insert
-- The original policy had ambiguous table references causing RLS violations

-- Drop the existing policy
drop policy if exists "Team admins can insert team members" on team_members;

-- Create a new policy that properly handles:
-- 1. Team creators adding themselves as first admin
-- 2. Admins adding new members
-- 3. Users joining via invite code
create policy "Allow team member insertion"
  on team_members for insert
  to authenticated
  with check (
    -- Allow if team has no members yet (team creator adding themselves)
    not exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
    )
    or
    -- Allow if user is already an admin of this team
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

