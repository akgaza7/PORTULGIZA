update public.subscribers
set reminder_channel = 'email'
where reminder_channel <> 'email';

alter table public.subscribers
  drop constraint if exists subscribers_reminder_channel_check;

alter table public.subscribers
  add constraint subscribers_reminder_channel_check
  check (reminder_channel = 'email');

create or replace function public.create_portulgiza_subscriber()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscribers (
    user_id,
    email,
    reminder_channel,
    daily_reminder_opt_in,
    reminder_consent_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    'email',
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

comment on column public.subscribers.reminder_channel is
  'Automated learning reminders are email-only to avoid WhatsApp Business Platform delivery charges.';
