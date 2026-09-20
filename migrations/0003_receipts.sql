-- Axiom interaction receipts + owner ledger. No guest contact fields.
create table if not exists axiom_receipts (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  question text not null,
  draft text not null default '',
  spoken text not null,
  flags_json text not null default '[]',
  status text not null default 'clean',
  created_at timestamptz not null default now()
);

create table if not exists axiom_ledger (
  id serial primary key,
  business_id text not null references businesses(id) on delete cascade,
  truth text not null,
  created_at timestamptz not null default now()
);

create index if not exists axiom_receipts_biz_idx on axiom_receipts (business_id, created_at desc);
create index if not exists axiom_ledger_biz_idx on axiom_ledger (business_id);
