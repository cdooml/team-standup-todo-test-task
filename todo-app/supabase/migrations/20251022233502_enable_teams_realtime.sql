-- Enable realtime for teams table so deletion events can be broadcast

do $$
begin
  -- Add teams table to realtime publication if not already added
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table teams;
  end if;
end $$;

