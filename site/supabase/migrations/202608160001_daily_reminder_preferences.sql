alter table public.subscribers
  add column if not exists mobile_number text,
  add column if not exists reminder_channel text not null default 'email',
  add column if not exists daily_reminder_opt_in boolean not null default false,
  add column if not exists reminder_consent_at timestamptz,
  add column if not exists reminder_timezone text not null default 'Europe/London',
  add column if not exists last_reminder_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscribers_reminder_channel_check'
  ) then
    alter table public.subscribers
      add constraint subscribers_reminder_channel_check
      check (reminder_channel in ('email', 'whatsapp'));
  end if;
end $$;

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

comment on column public.subscribers.mobile_number is
  'Subscriber mobile number in E.164 format. Never expose this value publicly.';
comment on column public.subscribers.daily_reminder_opt_in is
  'Explicit permission for one daily learning reminder on the selected channel.';
comment on column public.subscribers.last_reminder_sent_at is
  'Delivery audit field. Set only after the messaging provider confirms a send.';
comment on table public.subscribers is
  'Reminder delivery is eligible only while subscription_status is active, or while trialing before trial_ends_at.';
