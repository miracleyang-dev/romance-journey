-- ============================================================
-- Romance Journey — 完整重置脚本
-- ============================================================

-- 0. 清理旧数据
-- drop policy if exists "Members can view own couple" on couples;
-- drop policy if exists "Members can update own couple" on couples;
-- drop policy if exists "Authenticated users can create couple" on couples;
-- drop policy if exists "Users can view own memberships" on couple_members;
-- drop policy if exists "Users can join a couple" on couple_members;
-- drop policy if exists "Authenticated users can upload photos" on storage.objects;
-- drop policy if exists "Anyone can view photos" on storage.objects;
-- drop function if exists lookup_couple_by_invite;
-- drop table if exists couple_members;
-- drop table if exists couples;

-- 1. 情侣主表
create table couples (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  updated_at timestamptz default now()
);

-- 2. 成员关联表
create table couple_members (
  couple_id uuid references couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (couple_id, user_id)
);

-- 3. 索引
create index idx_couple_members_user on couple_members(user_id);

-- 4. 启用 RLS
alter table couples enable row level security;
alter table couple_members enable row level security;

-- 5. couples 表策略
create policy "Members can view own couple"
  on couples for select
  using (id in (select couple_id from couple_members where user_id = auth.uid()));

create policy "Members can update own couple"
  on couples for update
  using (id in (select couple_id from couple_members where user_id = auth.uid()));

create policy "Authenticated users can create couple"
  on couples for insert
  with check (auth.uid() is not null);

-- 6. couple_members 表策略
create policy "Users can view own memberships"
  on couple_members for select
  using (user_id = auth.uid());

create policy "Users can join a couple"
  on couple_members for insert
  with check (user_id = auth.uid());

-- 7. 邀请码查找函数
create or replace function lookup_couple_by_invite(code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from couples where invite_code = upper(code) limit 1;
$$;

-- 8. 启用 Realtime
alter publication supabase_realtime add table couples;

-- 9. Storage 策略（photos bucket 需先在 Dashboard 手动创建）
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid() is not null);

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');

-- 10. 确认所有未验证的用户
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;