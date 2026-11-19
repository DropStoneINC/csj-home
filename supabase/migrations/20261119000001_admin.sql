-- CSJ 資格ラボ 運用者用管理画面のスキーマ
-- 権限の考え方:
--   ・管理者 = admin_users に登録されたメールアドレスで Supabase Auth にログインし、メール確認済みのユーザー
--   ・テーブルは RLS を有効にし、管理者だけが読み書きできるポリシーを付ける（anon は一切アクセス不可）
--   ・学習者向けの読み取り・書き込みは、入力を検証する security definer 関数（public_* / log_* / submit_*）経由だけ

-- ---------------------------------------------------------------
-- 管理者
-- ---------------------------------------------------------------
create table if not exists public.admin_users (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 問題の上書き・追加
-- リポジトリの src/data/questions/*.json が「元データ」。
-- このテーブルに行がある問題は、DB の内容が元データより優先される。
-- 行を削除すると元データに戻る。元データにない id は管理画面で追加した問題。
-- ---------------------------------------------------------------
create table if not exists public.questions (
  id          text primary key check (id ~ '^[a-z]+-[0-9]{3}$'),
  category    text not null,
  level       smallint not null check (level between 1 and 3),
  subject     text not null check (subject in ('A', 'B')),
  question    text not null,
  choices     jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) = 4),
  answer      smallint not null check (answer between 0 and 3),
  explanation text not null,
  tags        text[] not null default '{}',
  -- published: 出題する / hidden: 出題しない（学習記録は残る）
  status      text not null default 'published' check (status in ('published', 'hidden')),
  note        text,                     -- 運用メモ（学習者には表示しない）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- お知らせ
-- ---------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 100),
  body       text not null default '' check (char_length(body) <= 2000),
  level      text not null default 'info' check (level in ('info', 'warning', 'maintenance')),
  published  boolean not null default false,
  starts_at  timestamptz,              -- null = すぐ
  ends_at    timestamptz,              -- null = 無期限
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 問題の誤り報告
-- ---------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  question_id text not null,
  kind        text not null check (kind in ('wrong_answer', 'explanation', 'typo', 'outdated', 'other')),
  message     text not null default '' check (char_length(message) <= 1000),
  selected    smallint check (selected between 0 and 3),
  client_id   text,                     -- 端末ごとの匿名ID
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_question_idx on public.reports (question_id);

-- ---------------------------------------------------------------
-- 匿名の利用ログ
-- type: answer（1問解答） / session（演習・模試の完了） / ai_ask（AI解説の質問）
-- ---------------------------------------------------------------
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  type        text not null check (type in ('answer', 'session', 'ai_ask')),
  client_id   text not null,
  question_id text,
  correct     boolean,
  mode        text,
  total       smallint,
  score       smallint,
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_question_idx on public.events (question_id) where type = 'answer';

alter table public.questions     enable row level security;
alter table public.announcements enable row level security;
alter table public.reports       enable row level security;
alter table public.events        enable row level security;
alter table public.admin_users   enable row level security;

-- updated_at を自動更新
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists questions_touch on public.questions;
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();
drop trigger if exists announcements_touch on public.announcements;
create trigger announcements_touch before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- 集計関数（管理画面のダッシュボード用）
-- 日付の区切りは日本時間
-- ---------------------------------------------------------------
create or replace function public.admin_daily_stats(days int default 30)
returns table (day date, users bigint, answers bigint, correct bigint, sessions bigint, ai_asks bigint)
language sql stable set search_path = '' as $$
  with d as (
    select generate_series(
      (now() at time zone 'Asia/Tokyo')::date - (days - 1),
      (now() at time zone 'Asia/Tokyo')::date,
      interval '1 day'
    )::date as day
  ), e as (
    select (created_at at time zone 'Asia/Tokyo')::date as day, type, client_id, correct
    from public.events
    where created_at >= (((now() at time zone 'Asia/Tokyo')::date - (days - 1))::timestamp at time zone 'Asia/Tokyo')
  )
  select d.day,
         count(distinct e.client_id),
         count(*) filter (where e.type = 'answer'),
         count(*) filter (where e.type = 'answer' and e.correct),
         count(*) filter (where e.type = 'session'),
         count(*) filter (where e.type = 'ai_ask')
  from d left join e on e.day = d.day
  group by d.day
  order by d.day;
$$;

create or replace function public.admin_question_stats(since_days int default 90)
returns table (question_id text, attempts bigint, correct bigint, users bigint, ai_asks bigint)
language sql stable set search_path = '' as $$
  select question_id,
         count(*) filter (where type = 'answer'),
         count(*) filter (where type = 'answer' and correct),
         count(distinct client_id) filter (where type = 'answer'),
         count(*) filter (where type = 'ai_ask')
  from public.events
  where question_id is not null
    and created_at >= now() - make_interval(days => since_days)
  group by question_id;
$$;

create or replace function public.admin_summary()
returns table (users_7d bigint, users_30d bigint, answers_7d bigint, answers_total bigint, ai_asks_7d bigint, open_reports bigint)
language sql stable set search_path = '' as $$
  select
    (select count(distinct client_id) from public.events where created_at >= now() - interval '7 days'),
    (select count(distinct client_id) from public.events where created_at >= now() - interval '30 days'),
    (select count(*) from public.events where type = 'answer' and created_at >= now() - interval '7 days'),
    (select count(*) from public.events where type = 'answer'),
    (select count(*) from public.events where type = 'ai_ask' and created_at >= now() - interval '7 days'),
    (select count(*) from public.reports where status = 'open');
$$;


-- ---------------------------------------------------------------
-- 管理者判定とポリシー
-- ---------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.admin_users a
    join auth.users u on lower(u.email) = a.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['questions', 'announcements', 'reports', 'events'] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

drop policy if exists admin_read on public.admin_users;
create policy admin_read on public.admin_users for select to authenticated using ((select public.is_admin()));
revoke all on public.admin_users from anon;
revoke insert, update, delete on public.admin_users from authenticated;

-- 集計関数は呼び出したユーザーの権限で動く（管理者以外は RLS により 0 件になる）
revoke all on function public.admin_daily_stats(int)    from public, anon;
revoke all on function public.admin_question_stats(int) from public, anon;
revoke all on function public.admin_summary()           from public, anon;
grant execute on function public.admin_daily_stats(int)    to authenticated;
grant execute on function public.admin_question_stats(int) to authenticated;
grant execute on function public.admin_summary()           to authenticated;

-- ---------------------------------------------------------------
-- 学習者向けの関数（anon から呼べる。入力はここで検証する）
-- ---------------------------------------------------------------

-- 問題の上書き（運用メモは返さない）
create or replace function public.public_question_overrides()
returns table (id text, category text, level smallint, subject text, question text, choices jsonb, answer smallint,
               explanation text, tags text[], status text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select id, category, level, subject, question, choices, answer, explanation, tags, status, updated_at
  from public.questions order by id;
$$;

-- 公開中（または開始前）のお知らせ
create or replace function public.public_announcements()
returns table (id uuid, title text, body text, level text, starts_at timestamptz, ends_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select id, title, body, level, starts_at, ends_at, updated_at
  from public.announcements
  where published and (ends_at is null or ends_at > now())
  order by created_at desc
  limit 10;
$$;

-- 利用ログ（1回100件まで。時刻は過去1日〜未来5分に丸める）
create or replace function public.log_events(p_client_id text, p_events jsonb)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  e jsonb;
  n integer := 0;
  at timestamptz;
begin
  if p_client_id !~ '^[A-Za-z0-9-]{8,64}$' or jsonb_typeof(p_events) <> 'array' then
    return 0;
  end if;
  for e in select value from jsonb_array_elements(p_events) limit 100 loop
    begin
      at := to_timestamp((e->>'at')::double precision / 1000);
    exception when others then
      at := null;
    end;
    if at is null or at < now() - interval '1 day' or at > now() + interval '5 minutes' then
      at := now();
    end if;
    if e->>'type' = 'answer' and e->>'q' ~ '^[a-z]+-[0-9]{3}$' and jsonb_typeof(e->'ok') = 'boolean' then
      insert into public.events (type, client_id, question_id, correct, created_at)
      values ('answer', p_client_id, e->>'q', (e->>'ok')::boolean, at);
      n := n + 1;
    elsif e->>'type' = 'session' and e->>'mode' in ('category', 'random', 'smart', 'weak', 'bookmark', 'mock')
          and jsonb_typeof(e->'total') = 'number' and jsonb_typeof(e->'score') = 'number' then
      insert into public.events (type, client_id, mode, total, score, created_at)
      values ('session', p_client_id, e->>'mode',
              least(greatest((e->>'total')::numeric, 0), 200)::smallint,
              least(greatest((e->>'score')::numeric, 0), least(greatest((e->>'total')::numeric, 0), 200))::smallint,
              at);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

create or replace function public.log_ai_ask(p_client_id text, p_question_id text)
returns void
language sql security definer set search_path = '' as $$
  insert into public.events (type, client_id, question_id)
  select 'ai_ask', p_client_id, p_question_id
  where p_client_id ~ '^[A-Za-z0-9-]{8,64}$' and p_question_id ~ '^[a-z]+-[0-9]{3}$';
$$;

-- 誤り報告（同じ端末からは1時間に20件まで）
create or replace function public.submit_report(p_question_id text, p_kind text, p_message text, p_selected smallint, p_client_id text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  rid uuid;
  cid text := case when p_client_id ~ '^[A-Za-z0-9-]{8,64}$' then p_client_id end;
begin
  if p_question_id !~ '^[a-z]+-[0-9]{3}$' then
    raise exception 'invalid question id' using errcode = '22023';
  end if;
  if cid is not null and (select count(*) from public.reports where client_id = cid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many reports' using errcode = 'P0429';
  end if;
  insert into public.reports (question_id, kind, message, selected, client_id)
  values (p_question_id, p_kind, left(coalesce(p_message, ''), 1000),
          case when p_selected between 0 and 3 then p_selected end, cid)
  returning id into rid;
  return rid;
end $$;

revoke all on function public.public_question_overrides() from public;
revoke all on function public.public_announcements() from public;
revoke all on function public.log_events(text, jsonb) from public;
revoke all on function public.log_ai_ask(text, text) from public;
revoke all on function public.submit_report(text, text, text, smallint, text) from public;
grant execute on function public.public_question_overrides() to anon, authenticated;
grant execute on function public.public_announcements() to anon, authenticated;
grant execute on function public.log_events(text, jsonb) to anon, authenticated;
grant execute on function public.log_ai_ask(text, text) to anon, authenticated;
grant execute on function public.submit_report(text, text, text, smallint, text) to anon, authenticated;
