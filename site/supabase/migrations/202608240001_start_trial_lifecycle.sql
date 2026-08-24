alter table public.subscribers
  add column if not exists full_name text,
  add column if not exists trial_activated_at timestamptz,
  add column if not exists trial_reminder_2d_sent_at timestamptz,
  add column if not exists trial_reminder_1d_sent_at timestamptz;

create index if not exists subscribers_trial_reminder_idx
  on public.subscribers (subscription_status, trial_ends_at);

create or replace function public.create_portulgiza_subscriber()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscribers (
    user_id,
    email,
    full_name,
    mobile_number,
    reminder_channel,
    daily_reminder_opt_in,
    reminder_consent_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'mobile_number', ''),
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
