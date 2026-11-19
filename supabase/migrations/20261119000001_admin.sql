-- CSJ 資格ラボ 運用者用管理画面のスキーマ
-- すべてのテーブルは RLS を有効にし、ポリシーは作らない（anon / authenticated からは読み書き不可）。
-- 読み書きは Next.js のサーバー側から service_role キーでのみ行う。

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
-- 集計関数（管理画面のダッシュボード用。service_role からのみ実行可）
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

revoke all on function public.admin_daily_stats(int)    from public, anon, authenticated;
revoke all on function public.admin_question_stats(int) from public, anon, authenticated;
revoke all on function public.admin_summary()           from public, anon, authenticated;
grant execute on function public.admin_daily_stats(int)    to service_role;
grant execute on function public.admin_question_stats(int) to service_role;
grant execute on function public.admin_summary()           to service_role;
