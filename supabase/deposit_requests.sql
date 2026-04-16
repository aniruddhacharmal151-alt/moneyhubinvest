-- Manual UPI deposit requests table
create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  utr text not null check (char_length(utr) >= 10),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_deposit_requests_user_id_created_at
  on public.deposit_requests(user_id, created_at desc);

-- Admin verification flow (run from secure admin context):
-- 1) Mark request approved
-- update public.deposit_requests
-- set status = 'approved'
-- where id = '<deposit_request_uuid>' and status = 'pending';
--
-- 2) Credit wallet only after approval
-- update public.wallet w
-- set balance = w.balance + dr.amount
-- from public.deposit_requests dr
-- where dr.id = '<deposit_request_uuid>'
--   and dr.status = 'approved'
--   and w.user_id = dr.user_id;
