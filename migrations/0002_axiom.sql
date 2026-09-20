-- AXIOM: booking presence for studios. Unowned rows; owner PIN is hashed on the row.
create table if not exists businesses (
  id text primary key,
  name text not null,
  niche text not null,
  tagline text not null default '',
  about text not null default '',
  pin_hash text not null,
  hours_json text not null default '{}',
  halo_theme text not null default 'spectrum',
  location_name text not null default '',
  location_note text not null default '',
  location_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  display_name text not null,
  role text not null default '',
  bio text not null default '',
  available boolean not null default true,
  sort_order int not null default 0
);

create table if not exists offerings (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  member_id int references team_members(id) on delete set null,
  title text not null,
  description text not null default '',
  duration_min int not null default 30,
  price_cents int not null default 0,
  image text,
  kind text not null default 'service'
);

create table if not exists posts (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  body text not null,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  member_id int,
  offering_id int,
  guest_handle text not null,
  slot_at timestamptz not null,
  status text not null default 'pending',
  code text not null unique,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists team_business_idx on team_members (business_id);
create index if not exists offerings_business_idx on offerings (business_id);
create index if not exists posts_business_idx on posts (business_id);
create index if not exists bookings_business_slot_idx on bookings (business_id, slot_at);
