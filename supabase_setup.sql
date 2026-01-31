-- 1. Create table (if you haven't already/to be safe)
create table if not exists dictionary (
  id uuid default gen_random_uuid() primary key,
  brand text unique not null,
  generic text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table dictionary enable row level security;

-- 3. Create Policy for Public Access
-- This allows Select, Insert, Update, and Delete for anyone with the API Key/URL.
-- Required since we don't have a Login screen in the app.
create policy "Allow Public Access"
on dictionary
for all
using (true)
with check (true);
