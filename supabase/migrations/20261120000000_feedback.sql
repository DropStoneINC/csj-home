-- アプリへのご意見・改善要望
-- 学習者はアプリ下部の「ご意見・改善要望」から送信する（ログイン不要・匿名）。
-- 書き込みは submit_feedback 関数経由だけ。読み書きは管理者だけ（RLS）。

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('feature', 'usability', 'bug', 'content', 'other')),
  message     text not null check (char_length(message) between 1 and 2000),
  page        text check (char_length(page) <= 200),   -- 送信したときに開いていた画面のパス
  client_id   text,                                    -- 端末ごとの匿名ID
  -- open: 未対応 / planned: 対応予定 / done: 対応済み / dismissed: 見送り
  status      text not null default 'open' check (status in ('open', 'planned', 'done', 'dismissed')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists feedback_status_created_idx on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;
drop policy if exists admin_all on public.feedback;
create policy admin_all on public.feedback for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.feedback from anon;

drop trigger if exists feedback_touch on public.feedback;
create trigger feedback_touch before update on public.feedback
  for each row execute function public.touch_updated_at();

-- 送信（同じ端末からは1時間に10件まで）
create or replace function public.submit_feedback(p_kind text, p_message text, p_page text, p_client_id text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  rid uuid;
  cid text := case when p_client_id ~ '^[A-Za-z0-9-]{8,64}$' then p_client_id end;
  msg text := left(btrim(coalesce(p_message, '')), 2000);
  pg  text := case when p_page ~ '^/[A-Za-z0-9/_\-]{0,199}$' then p_page end;
begin
  if p_kind not in ('feature', 'usability', 'bug', 'content', 'other') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;
  if msg = '' then
    raise exception 'empty message' using errcode = '22023';
  end if;
  if cid is not null and (select count(*) from public.feedback where client_id = cid and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too many feedback' using errcode = 'P0429';
  end if;
  insert into public.feedback (kind, message, page, client_id)
  values (p_kind, msg, pg, cid)
  returning id into rid;
  return rid;
end $$;

revoke all on function public.submit_feedback(text, text, text, text) from public;
grant execute on function public.submit_feedback(text, text, text, text) to anon, authenticated;

-- ダッシュボードの集計に未対応の要望数を追加（戻り値の列が変わるので作り直す）
drop function if exists public.admin_summary();
create function public.admin_summary()
returns table (users_7d bigint, users_30d bigint, answers_7d bigint, answers_total bigint, ai_asks_7d bigint, open_reports bigint, open_feedback bigint)
language sql stable set search_path = '' as $$
  select
    (select count(distinct client_id) from public.events where created_at >= now() - interval '7 days'),
    (select count(distinct client_id) from public.events where created_at >= now() - interval '30 days'),
    (select count(*) from public.events where type = 'answer' and created_at >= now() - interval '7 days'),
    (select count(*) from public.events where type = 'answer'),
    (select count(*) from public.events where type = 'ai_ask' and created_at >= now() - interval '7 days'),
    (select count(*) from public.reports where status = 'open'),
    (select count(*) from public.feedback where status = 'open');
$$;
revoke all on function public.admin_summary() from public, anon;
grant execute on function public.admin_summary() to authenticated;
