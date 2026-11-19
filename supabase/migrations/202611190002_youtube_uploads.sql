alter table public.posts add column if not exists title text;
alter table public.posts add column if not exists post_type text not null default 'text';
alter table public.posts add column if not exists metadata jsonb not null default '{}';

alter table public.posts drop constraint if exists posts_content_check;
alter table public.posts add constraint posts_content_check check (char_length(content) <= 5000);
alter table public.posts drop constraint if exists posts_title_check;
alter table public.posts add constraint posts_title_check check (title is null or char_length(title) between 1 and 100);
alter table public.posts drop constraint if exists posts_post_type_check;
alter table public.posts add constraint posts_post_type_check check (post_type in ('text', 'video'));
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'uploading', 'publishing', 'published', 'partially_failed', 'failed', 'scheduled'));

alter table public.post_targets drop constraint if exists post_targets_status_check;
alter table public.post_targets add constraint post_targets_status_check check (status in ('pending', 'uploading', 'publishing', 'published', 'failed'));
