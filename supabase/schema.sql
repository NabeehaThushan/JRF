create extension if not exists pgcrypto;

create table if not exists requisitions (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  justification text not null,
  tasks text not null,
  must_have text not null,
  approved_budget text,
  jd_text text,
  advert_text text,
  screening_fmcg boolean default true,
  screening_education boolean default true,
  status text not null default 'in_review',
  created_at timestamptz default now()
);

create table if not exists review_steps (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id) on delete cascade,
  stage_order int not null,
  reviewer_name text not null,
  reviewer_email text not null,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending',
  comment text,
  acted_at timestamptz
);
