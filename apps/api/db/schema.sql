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

-- Feedback on a brief. Anyone signed in can comment; editors (ADs/CDs) approve
-- a comment "to action", which sends it to the designer.
create table if not exists comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      text not null references posts (id) on delete cascade,
  body         text not null check (length(body) between 1 and 4000),
  role         text not null default 'Designer'
               check (role in ('Designer', 'Client', 'Art Director', 'Creative Director')),
  author_id    text not null,              -- neon_auth."user".id
  author_name  text not null default '',
  status       text not null default 'open' check (status in ('open', 'actioned')),
  actioned_by  text,                       -- display name of the approver
  actioned_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists comments_post_idx on comments (post_id, created_at);

-- Reference images on a brief, stored in the "storage" bucket under inspiration/.
create table if not exists inspiration (
  id            uuid primary key default gen_random_uuid(),
  post_id       text not null references posts (id) on delete cascade,
  object_key    text not null unique,
  name          text not null default '',
  content_type  text not null,
  added_by      text not null default '',  -- display name
  created_at    timestamptz not null default now()
);
create index if not exists inspiration_post_idx on inspiration (post_id, created_at);

-- Artwork pulled from Figma: one row per slide frame ("CS - <title> - Slide NN").
-- still_key is the PNG; video_key is an MP4 when the frame has a timeline.
create table if not exists artwork_slides (
  post_id     text not null references posts (id) on delete cascade,
  n           integer not null,
  node_id     text not null,
  still_key   text not null,
  video_key   text,
  animated    boolean not null default false,
  synced_at   timestamptz not null default now(),
  primary key (post_id, n)
);

-- Keys an editor pastes into the Creative Seat Figma plugin to publish artwork.
-- Only a SHA-256 of the key is stored; the key is shown once when created.
create table if not exists plugin_keys (
  id            uuid primary key default gen_random_uuid(),
  key_hash      text not null unique,
  owner_email   text not null,
  label         text not null default '',
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
