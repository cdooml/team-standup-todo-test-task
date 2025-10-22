-- Fix RLS policy for teams to allow creators to see teams they created
-- even before they're added to team_members

-- Drop the existing policy
drop policy if exists "Team members can view teams" on teams;

-- Recreate with fix: allow users to see teams they created OR are members of
create policy "Team members can view teams"
  on teams for select
  to authenticated
  using (
    created_by = auth.uid() 
    or is_team_member(id, auth.uid())
  );

