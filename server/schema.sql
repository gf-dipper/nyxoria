-- Nyxoria RPG – adatbázis (Supabase → SQL Editor → illeszd be és futtasd)
-- Minden írás és olvasás a szerverfüggvényen ("nyx") keresztül megy, ezért a táblákat
-- a böngészőből senki nem érheti el közvetlenül: RLS be van kapcsolva, szabály nélkül.

create table if not exists public.players (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  discord_id   text,
  discord_name text,
  avatar_url   text,
  verified_at  timestamptz,
  is_admin     boolean not null default false,
  banned       boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.heroes (
  user_id    uuid primary key references public.players(user_id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 16),
  class_id   text not null,
  level      int  not null default 1,
  xp         int  not null default 0,
  power      int  not null default 0,
  mythics    int  not null default 0,
  legendaries int not null default 0,
  wins       int  not null default 0,
  save       jsonb not null,
  version    int  not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active_at  timestamptz not null default now()
);
create unique index if not exists heroes_name_key on public.heroes (lower(name));
create index if not exists heroes_rank_idx on public.heroes (level desc, xp desc);
create index if not exists heroes_active_idx on public.heroes (active_at desc);

create table if not exists public.chronicle (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  user_id    uuid references public.players(user_id) on delete set null,
  kind       text not null,
  html       text not null
);
create index if not exists chronicle_time_idx on public.chronicle (created_at desc);

create table if not exists public.world_bosses (
  id         bigserial primary key,
  week_start date not null unique,
  name       text not null,
  region     text not null,
  level      int  not null,
  max_hp     bigint not null,
  hp         bigint not null,
  weakness   text not null,
  starts_at  timestamptz not null,
  rage_at    timestamptz not null,
  ends_at    timestamptz not null,
  killed_at  timestamptz,
  finalized  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.boss_participants (
  boss_id  bigint not null references public.world_bosses(id) on delete cascade,
  user_id  uuid   not null references public.players(user_id) on delete cascade,
  damage   bigint not null default 0,
  hits     int    not null default 0,
  day      text,
  hits_day int    not null default 0,
  claimed  int[]  not null default '{}',
  title    text,
  primary key (boss_id, user_id)
);
create index if not exists boss_participants_dmg_idx on public.boss_participants (boss_id, damage desc);

create table if not exists public.world_state (
  id             int primary key default 1 check (id = 1),
  median_level   int not null default 0,
  active_players int not null default 0,
  updated_at     timestamptz not null default '2000-01-01'
);
insert into public.world_state (id) values (1) on conflict (id) do nothing;

create table if not exists public.action_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  user_id uuid,
  action  text not null,
  info    jsonb
);
create index if not exists action_log_time_idx on public.action_log (at desc);

alter table public.players           enable row level security;
alter table public.heroes            enable row level security;
alter table public.chronicle         enable row level security;
alter table public.world_bosses      enable row level security;
alter table public.boss_participants enable row level security;
alter table public.world_state       enable row level security;
alter table public.action_log        enable row level security;

-- ===== Céh, csapat-jutalmak (2026-11: Aréna, Csapatküldetések, Céh) =====
-- Az Aréna pontszáma és a Holdtorony a hős mentésében él (save.arena, save.tower), ezekhez nem kell új tábla.
create table if not exists public.guilds (
  id         bigserial primary key,
  name       text not null check (char_length(name) between 3 and 24),
  tag        text not null check (char_length(tag) between 2 and 4),
  color      text not null default '#7f8cff',
  emblem     text not null default 'hold',
  motto      text not null default '',
  owner      uuid references public.players(user_id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_name_key on public.guilds (lower(name));
create unique index if not exists guilds_tag_key on public.guilds (lower(tag));

create table if not exists public.guild_members (
  user_id   uuid primary key references public.players(user_id) on delete cascade,
  guild_id  bigint not null references public.guilds(id) on delete cascade,
  role      text not null default 'tag',
  joined_at timestamptz not null default now(),
  week      text,
  week_wins int not null default 0,
  claimed   int[] not null default '{}'
);
create index if not exists guild_members_guild_idx on public.guild_members (guild_id);

create table if not exists public.guild_log (
  id         bigserial primary key,
  guild_id   bigint not null references public.guilds(id) on delete cascade,
  created_at timestamptz not null default now(),
  html       text not null
);
create index if not exists guild_log_idx on public.guild_log (guild_id, id desc);

-- más játékosoktól kapott jutalmak (pl. csapatküldetés társaként): a következő belépéskor íródnak jóvá
create table if not exists public.pending_rewards (
  id         bigserial primary key,
  user_id    uuid not null references public.players(user_id) on delete cascade,
  silver     int not null default 0,
  dust       int not null default 0,
  html       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists pending_rewards_user_idx on public.pending_rewards (user_id);

alter table public.guilds          enable row level security;
alter table public.guild_members   enable row level security;
alter table public.guild_log       enable row level security;
alter table public.pending_rewards enable row level security;

-- a céhcélok jutalmainak átvétele: hetente célonként egyszer, akkor is, ha valaki ki- és visszalép
create table if not exists public.guild_claims (
  user_id uuid not null references public.players(user_id) on delete cascade,
  week    text not null,
  goal    int  not null,
  primary key (user_id, week, goal)
);
alter table public.guild_claims enable row level security;

-- ===== Céhháború és heti céhstatisztika =====
create table if not exists public.guild_weeks (
  guild_id bigint not null references public.guilds(id) on delete cascade,
  week     text not null,
  wins     int  not null default 0,
  primary key (guild_id, week)
);
create table if not exists public.member_weeks (
  user_id  uuid not null references public.players(user_id) on delete cascade,
  guild_id bigint not null,
  week     text not null,
  wins     int  not null default 0,
  primary key (user_id, week)
);
-- heti párosítás: a hét első lekérésekor jön létre; a később alakult céhek a következő héttől harcolnak
create table if not exists public.guild_wars (
  week text not null,
  a    bigint not null,
  b    bigint not null,
  primary key (week, a)
);
-- a háború sora akkor is megmarad, ha az egyik céh feloszlik (különben a győztes elveszítené a jutalmát)
alter table public.guild_wars drop constraint if exists guild_wars_a_fkey;
alter table public.guild_wars drop constraint if exists guild_wars_b_fkey;
create index if not exists guild_wars_b_idx on public.guild_wars (week, b);
alter table public.guilds add column if not exists stars int not null default 0;
alter table public.guilds add column if not exists star_week text;
alter table public.guild_weeks  enable row level security;
alter table public.member_weeks enable row level security;
alter table public.guild_wars   enable row level security;

-- legendás fokozat (tárgyfrissítés)
alter table public.heroes add column if not exists legendaries int not null default 0;

-- több hős fiókonként (legfeljebb 3): az épp játszott hős a heroes táblában van, a többi itt pihen.
-- A heti szörny ütései, a céh és a napi ajándék a fiókhoz tartozik, így egy második hőssel sem lehet halmozni.
create table if not exists public.hero_slots (
  user_id     uuid not null references public.players(user_id) on delete cascade,
  slot        int  not null check (slot between 1 and 2),
  name        text not null,
  class_id    text not null,
  level       int  not null default 1,
  xp          int  not null default 0,
  power       int  not null default 0,
  mythics     int  not null default 0,
  legendaries int  not null default 0,
  save        jsonb not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, slot)
);
create unique index if not exists hero_slots_name_key on public.hero_slots (lower(name));
alter table public.hero_slots enable row level security;
-- a céhbe számító győzelmek napi felső határa fiókonként
alter table public.guild_members add column if not exists day text;
alter table public.guild_members add column if not exists day_wins int not null default 0;
