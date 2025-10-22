-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Teams table
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

alter table teams enable row level security;

create policy "Team members can view teams"
  on teams for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_id = id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create teams"
  on teams for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Team members table
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamp with time zone default now(),
  unique(team_id, user_id)
);

alter table team_members enable row level security;

create policy "Team members can view team members"
  on team_members for select
  to authenticated
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id and tm.user_id = auth.uid()
    )
  );

create policy "Team admins can insert team members"
  on team_members for insert
  to authenticated
  with check (
    exists (
      select 1 from team_members
      where team_id = team_members.team_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
    or not exists (
      select 1 from team_members
      where team_id = team_members.team_id
    )
  );

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
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

-- Create indexes for better performance
create index if not exists tasks_team_section_position_idx on tasks(team_id, section, position);
create index if not exists tasks_user_id_idx on tasks(user_id);

alter table tasks enable row level security;

create policy "Team members can view tasks"
  on tasks for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_id = tasks.team_id and user_id = auth.uid()
    )
  );

create policy "Team members can create tasks"
  on tasks for insert
  to authenticated
  with check (
    exists (
      select 1 from team_members
      where team_id = tasks.team_id and user_id = auth.uid()
    )
  );

create policy "Team members can update tasks"
  on tasks for update
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_id = tasks.team_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own tasks"
  on tasks for delete
  to authenticated
  using (user_id = auth.uid());

-- Presence table
create table if not exists presence (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_seen timestamp with time zone default now(),
  unique(team_id, user_id)
);

create index if not exists presence_last_seen_idx on presence(last_seen);

alter table presence enable row level security;

create policy "Team members can view presence"
  on presence for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_id = presence.team_id and user_id = auth.uid()
    )
  );

create policy "Users can upsert own presence"
  on presence for insert
  to authenticated
  with check (user_id = auth.uid());

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
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- Enable realtime for tasks and presence
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table presence;
alter publication supabase_realtime add table team_members;

