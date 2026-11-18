create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 500),
  color text not null default '#6553d9' check (color ~ '^#[0-9a-fA-F]{6}$'),
  timezone text not null default 'UTC',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.project_social_accounts (
  project_id uuid not null references public.projects(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, social_account_id)
);

create index if not exists projects_workspace_status_idx on public.projects(workspace_id, status);
create index if not exists project_social_accounts_account_idx on public.project_social_accounts(social_account_id);

alter table public.projects enable row level security;
alter table public.project_social_accounts enable row level security;

-- Project writes are performed by trusted server routes after workspace membership checks.
revoke all on public.projects from anon, authenticated;
revoke all on public.project_social_accounts from anon, authenticated;
