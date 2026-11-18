create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 3000),
  status text not null default 'draft' check (status in ('draft', 'publishing', 'published', 'partially_failed', 'failed', 'scheduled')),
  scheduled_for timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete restrict,
  platform text not null check (platform in ('x', 'linkedin', 'facebook', 'instagram', 'threads', 'youtube')),
  status text not null default 'pending' check (status in ('pending', 'publishing', 'published', 'failed')),
  provider_post_id text,
  error_message text,
  metadata jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, social_account_id)
);

create index if not exists posts_project_created_idx on public.posts(project_id, created_at desc);
create index if not exists posts_workspace_status_idx on public.posts(workspace_id, status);
create index if not exists posts_scheduled_idx on public.posts(scheduled_for) where status = 'scheduled';
create index if not exists post_targets_post_idx on public.post_targets(post_id);

alter table public.posts enable row level security;
alter table public.post_targets enable row level security;

-- Publishing records are only accessed by trusted server routes after membership checks.
revoke all on public.posts from anon, authenticated;
revoke all on public.post_targets from anon, authenticated;
