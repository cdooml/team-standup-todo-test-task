-- Create all tables first, then add policies

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Teams table
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Team members table
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamp with time zone default now(),
  unique(team_id, user_id)
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  section text not null check (section in ('yesterday', 'today', 'blockers')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  position int not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Presence table
create table if not exists presence (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_seen timestamp with time zone default now(),
  unique(team_id, user_id)
);

-- Create indexes for better performance
create index if not exists tasks_team_section_position_idx on tasks(team_id, section, position);
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists presence_last_seen_idx on presence(last_seen);

-- Create helper function to check team membership (bypasses RLS)
create or replace function is_team_member(team_uuid uuid, user_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from team_members
    where team_id = team_uuid and user_id = user_uuid
  );
$$ language sql security definer;

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tasks enable row level security;
alter table presence enable row level security;

-- Profiles policies
drop policy if exists "Public profiles are viewable by authenticated users" on profiles;
create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Teams policies
drop policy if exists "Team members can view teams" on teams;
create policy "Team members can view teams"
  on teams for select
  to authenticated
  using (is_team_member(id, auth.uid()));

drop policy if exists "Authenticated users can create teams" on teams;
create policy "Authenticated users can create teams"
  on teams for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Team members policies
drop policy if exists "Team members can view team members" on team_members;
create policy "Team members can view team members"
  on team_members for select
  to authenticated
  using (is_team_member(team_id, auth.uid()));

drop policy if exists "Team admins can insert team members" on team_members;
create policy "Team admins can insert team members"
  on team_members for insert
  to authenticated
  with check (
    -- User is admin of the team OR team has no members yet (first member)
    (
      select role from team_members 
      where team_id = team_members.team_id 
        and user_id = auth.uid()
    ) = 'admin'
    or not exists (
      select 1 from team_members
      where team_id = team_members.team_id
    )
  );

-- Tasks policies
drop policy if exists "Team members can view tasks" on tasks;
create policy "Team members can view tasks"
  on tasks for select
  to authenticated
  using (is_team_member(team_id, auth.uid()));

drop policy if exists "Team members can create tasks" on tasks;
create policy "Team members can create tasks"
  on tasks for insert
  to authenticated
  with check (is_team_member(team_id, auth.uid()));

drop policy if exists "Team members can update tasks" on tasks;
create policy "Team members can update tasks"
  on tasks for update
  to authenticated
  using (is_team_member(team_id, auth.uid()));

drop policy if exists "Users can delete own tasks" on tasks;
create policy "Users can delete own tasks"
  on tasks for delete
  to authenticated
  using (user_id = auth.uid());

-- Presence policies
drop policy if exists "Team members can view presence" on presence;
create policy "Team members can view presence"
  on presence for select
  to authenticated
  using (is_team_member(team_id, auth.uid()));

drop policy if exists "Users can upsert own presence" on presence;
create policy "Users can upsert own presence"
  on presence for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own presence" on presence;
create policy "Users can update own presence"
  on presence for update
  to authenticated
  using (user_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- Enable realtime for tasks and presence
do $$
begin
  -- Add tables to realtime publication if not already added
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table presence;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table team_members;
  end if;
end $$;

