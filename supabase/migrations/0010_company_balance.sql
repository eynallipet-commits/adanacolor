-- Açık hesap (cari bakiye) sistemi: eski müşteriler cariye geçmiş borç olarak eklenebilsin,
-- admin seçtiği carilerde bakiye sıfırlanmadan yeni sipariş verilmesini engelleyebilsin.

alter table companies
  add column balance numeric(12,2) not null default 0,
  add column balance_block_enabled boolean not null default false;

create table company_balance_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index company_balance_transactions_company_id_idx on company_balance_transactions(company_id);

-- Bakiye hareketini ve companies.balance güncellemesini tek işlemde, admin-only olarak yapar.
create or replace function public.adjust_company_balance(p_company_id uuid, p_amount numeric, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Yetkiniz yok';
  end if;

  insert into company_balance_transactions (company_id, amount, note, created_by)
  values (p_company_id, p_amount, p_note, auth.uid());

  update companies set balance = balance + p_amount where id = p_company_id;
end;
$$;

alter table company_balance_transactions enable row level security;

create policy "company_balance_transactions_select" on company_balance_transactions for select
  using (is_admin() or company_id = my_company_id());
create policy "company_balance_transactions_admin_write" on company_balance_transactions for all
  using (is_admin()) with check (is_admin());
