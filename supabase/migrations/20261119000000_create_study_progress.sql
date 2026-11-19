-- CSJ 資格ラボ: ログインユーザーの学習記録（1ユーザー1行、アプリの Progress を JSON で保存）
create table if not exists public.study_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  exam text not null default 'sg',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_progress enable row level security;

create policy "study_progress_select_own" on public.study_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_progress_insert_own" on public.study_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_progress_update_own" on public.study_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "study_progress_delete_own" on public.study_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.study_progress from anon;
grant select, insert, update, delete on public.study_progress to authenticated;
