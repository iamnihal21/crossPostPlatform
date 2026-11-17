create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('x', 'linkedin', 'meta', 'threads', 'google')),
  provider_user_id text not null,
  provider_username text,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'error')),
  scopes text[] not null default '{}',
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  last_error text,
  created_by uuid not null references auth.users(id) on delete cascade,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, provider_user_id)
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.social_connections(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null check (platform in ('x', 'linkedin', 'facebook', 'instagram', 'threads', 'youtube')),
  external_account_id text not null,
  display_name text not null,
  username text,
  avatar_url text,
  account_token_ciphertext text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, platform, external_account_id)
);

create index if not exists social_connections_workspace_idx on public.social_connections(workspace_id);
create index if not exists social_connections_expiry_idx on public.social_connections(expires_at) where status = 'active';
create index if not exists social_accounts_workspace_idx on public.social_accounts(workspace_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_accounts enable row level security;

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces" on public.workspaces for select to authenticated
using (exists (select 1 from public.workspace_members member where member.workspace_id = id and member.user_id = auth.uid()));

drop policy if exists "Users can view their memberships" on public.workspace_members;
create policy "Users can view their memberships" on public.workspace_members for select to authenticated
using (user_id = auth.uid());

-- Social token tables deliberately have no client policies. Only trusted server code using
-- the service role can access them after verifying workspace membership.

create or replace function public.create_personal_workspace_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  workspace_id uuid;
  display_name text;
begin
  display_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'My workspace');
  insert into public.workspaces (name, slug, owner_id)
  values (display_name, 'personal-' || substr(new.id::text, 1, 12), new.id)
  returning id into workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (workspace_id, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists create_personal_workspace_after_signup on auth.users;
create trigger create_personal_workspace_after_signup
after insert on auth.users
for each row execute procedure public.create_personal_workspace_for_new_user();

revoke all on public.social_connections from anon, authenticated;
revoke all on public.social_accounts from anon, authenticated;
grant select on public.workspaces, public.workspace_members to authenticated;
