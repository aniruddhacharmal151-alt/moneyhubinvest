-- Manual UPI deposit requests table
create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  utr text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_deposit_requests_user_id_created_at
  on public.deposit_requests(user_id, created_at desc);
