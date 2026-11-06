-- Bảng tác vụ tạo ảnh (C05, production). Sprint 1 scaffold dùng JobStore
-- in-memory với cùng các trường; khi nối Supabase thì dùng bảng này.
create table if not exists public.image_jobs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  owner_id uuid not null,
  content text not null,
  prompt text not null,
  provider text not null check (provider in ('gemini', 'openai', 'stability', 'replicate')),
  model text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'succeeded', 'failed')),
  storage_key text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists image_jobs_owner_idx on public.image_jobs (owner_id, created_at desc);
create index if not exists image_jobs_entry_idx on public.image_jobs (entry_id);
create index if not exists image_jobs_status_idx on public.image_jobs (status, created_at);

-- RLS: mỗi user chỉ thấy job của chính mình (bật khi nối Supabase Auth).
-- alter table public.image_jobs enable row level security;
-- create policy "owner reads own jobs" on public.image_jobs
--   for select using (auth.uid() = owner_id);
