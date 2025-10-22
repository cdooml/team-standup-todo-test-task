-- Add RLS policy to allow team admins to delete teams

drop policy if exists "Team admins can delete teams" on teams;

create policy "Team admins can delete teams"
  on teams for delete
  to authenticated
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

