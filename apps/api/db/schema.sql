-- Creative Seat planner schema. Idempotent: safe to re-run.

create table if not exists posts (
  id                text primary key default 'p' || substr(md5(random()::text), 1, 10),
  number            integer not null,
  title             text not null default 'Untitled post',
  pillar            text not null default 'seat'
                    check (pillar in ('backlog', 'seat', 'work', 'service')),
  series            text not null default ''
                    check (series in ('', 'Seat No.', 'Brief → Built', 'Marketing PSA')),
  platform          text not null default '',
  format            text not null default '',
  sizes             jsonb not null default '[]',   -- ["1080×1350", …]
  post_date         date,                          -- null = not on the calendar
  status            text not null default 'brief'
                    check (status in ('brief', 'prod', 'review', 'ok', 'posted')),
  objective         text not null default '',
  idea              text not null default '',
  art_direction     jsonb not null default '[]',   -- [["Composition", "…"], …]
  look_here         text not null default '',
  hold_back         text not null default '',
  asset_copy        jsonb not null default '[]',   -- [["Headline", "…"], …]
  caption_linkedin  text not null default '',
  caption_instagram text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        text
);

create index if not exists posts_post_date_idx on posts (post_date);

-- People allowed to edit. Matched case-insensitively against neon_auth."user".email,
-- so an editor can be added before they've signed up.
create table if not exists editors (
  email    text primary key,
  added_at timestamptz not null default now()
);
