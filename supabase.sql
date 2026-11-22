-- LifeOS: одна таблица документов на пользователя
create table if not exists public.lifeos_docs (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, id)
);
alter table public.lifeos_docs enable row level security;
create policy "own rows select" on public.lifeos_docs for select using (auth.uid() = user_id);
create policy "own rows insert" on public.lifeos_docs for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.lifeos_docs for update using (auth.uid() = user_id);
create policy "own rows delete" on public.lifeos_docs for delete using (auth.uid() = user_id);
alter publication supabase_realtime add table public.lifeos_docs;
