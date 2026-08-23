create table if not exists public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_ends_at timestamptz,
  mobile_number text,
  reminder_channel text not null default 'email'
    check (reminder_channel in ('email', 'whatsapp')),
  daily_reminder_opt_in boolean not null default false,
  reminder_consent_at timestamptz,
  reminder_timezone text not null default 'Europe/London',
  last_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  mastery_score smallint not null default 0 check (mastery_score between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;
alter table public.learning_progress enable row level security;

drop policy if exists "Subscribers can read their own account" on public.subscribers;
create policy "Subscribers can read their own account" on public.subscribers
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Subscribers can read their own progress" on public.learning_progress;
create policy "Subscribers can read their own progress" on public.learning_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Subscribers can insert their own progress" on public.learning_progress;
create policy "Subscribers can insert their own progress" on public.learning_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Subscribers can update their own progress" on public.learning_progress;
create policy "Subscribers can update their own progress" on public.learning_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.subscribers to authenticated;
revoke insert, update, delete on public.subscribers from authenticated;
grant select, insert, update on public.learning_progress to authenticated;
revoke delete on public.learning_progress from authenticated;

create or replace function public.create_portulgiza_subscriber()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscribers (
    user_id,
    email,
    mobile_number,
    reminder_channel,
    daily_reminder_opt_in,
    reminder_consent_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'mobile_number', ''),
    case when new.raw_user_meta_data ->> 'reminder_channel' = 'whatsapp' then 'whatsapp' else 'email' end,
    coalesce(new.raw_user_meta_data ->> 'daily_reminder_opt_in', 'false') = 'true',
    case
      when coalesce(new.raw_user_meta_data ->> 'daily_reminder_opt_in', 'false') = 'true'
        then nullif(new.raw_user_meta_data ->> 'reminder_consent_at', '')::timestamptz
      else null
    end
  );
  insert into public.learning_progress (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_portulgiza_user_created on auth.users;
create trigger on_portulgiza_user_created after insert on auth.users
  for each row execute procedure public.create_portulgiza_subscriber();
