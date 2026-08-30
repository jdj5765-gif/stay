-- ============================================================
-- stay: 숙소 예약 서비스 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전하도록 작성했습니다.
-- ============================================================

create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- profiles: auth.users 의 공개 프로필
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null default '',
  created_at timestamptz not null default now()
);

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- listings: 숙소
-- ------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  host_id         uuid not null references auth.users on delete cascade,
  title           text not null check (length(title) between 2 and 80),
  description     text not null default '',
  address         text not null,
  price_per_night integer not null check (price_per_night >= 0),
  max_guests      smallint not null default 2 check (max_guests between 1 and 30),
  bedrooms        smallint not null default 1 check (bedrooms >= 0),
  beds            smallint not null default 1 check (beds >= 0),
  baths           smallint not null default 1 check (baths >= 0),
  image_urls      text[] not null default '{}',
  is_published    boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists listings_host_id_idx on public.listings (host_id);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

-- ------------------------------------------------------------
-- bookings: 예약
--
-- 이 서비스의 핵심 제약. stay 는 [체크인, 체크아웃) 반열림 구간이라
-- 8/1~8/3 예약과 8/3~8/5 예약은 겹치지 않는 것으로 처리됩니다
-- (체크아웃 당일에 다음 손님이 체크인 가능).
--
-- EXCLUDE 제약이 DB 레벨에서 동시 요청을 직렬화하므로,
-- 애플리케이션에서 "빈 날짜인지 조회 후 INSERT" 하는 경쟁 조건이 있어도
-- 더블부킹은 물리적으로 불가능합니다.
-- ------------------------------------------------------------
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings on delete cascade,
  guest_id    uuid not null references auth.users on delete cascade,
  check_in    date not null,
  check_out   date not null,
  guests      smallint not null default 1 check (guests >= 1),
  total_price integer not null check (total_price >= 0),
  status      text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at  timestamptz not null default now(),
  stay        daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  constraint bookings_valid_range check (check_out > check_in)
);

create index if not exists bookings_listing_id_idx on public.bookings (listing_id);
create index if not exists bookings_guest_id_idx on public.bookings (guest_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_double_booking'
  ) then
    alter table public.bookings
      add constraint bookings_no_double_booking
      exclude using gist (listing_id with =, stay with &&)
      where (status = 'confirmed');
  end if;
end;
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "프로필은 누구나 조회" on public.profiles;
create policy "프로필은 누구나 조회" on public.profiles
  for select using (true);

drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "공개된 숙소는 누구나 조회" on public.listings;
create policy "공개된 숙소는 누구나 조회" on public.listings
  for select using (is_published or auth.uid() = host_id);

drop policy if exists "로그인 사용자는 숙소 등록" on public.listings;
create policy "로그인 사용자는 숙소 등록" on public.listings
  for insert with check (auth.uid() = host_id);

drop policy if exists "호스트만 자기 숙소 수정" on public.listings;
create policy "호스트만 자기 숙소 수정" on public.listings
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

drop policy if exists "호스트만 자기 숙소 삭제" on public.listings;
create policy "호스트만 자기 숙소 삭제" on public.listings
  for delete using (auth.uid() = host_id);

-- 예약은 게스트 본인과 해당 숙소의 호스트만 볼 수 있습니다.
-- (다른 사람의 예약 날짜는 아래 booked_ranges 함수로만 노출)
drop policy if exists "게스트와 호스트만 예약 조회" on public.bookings;
create policy "게스트와 호스트만 예약 조회" on public.bookings
  for select using (
    auth.uid() = guest_id
    or exists (
      select 1 from public.listings l
      where l.id = bookings.listing_id and l.host_id = auth.uid()
    )
  );

drop policy if exists "본인 명의로만 예약 생성" on public.bookings;
create policy "본인 명의로만 예약 생성" on public.bookings
  for insert with check (auth.uid() = guest_id);

drop policy if exists "게스트와 호스트만 예약 변경" on public.bookings;
create policy "게스트와 호스트만 예약 변경" on public.bookings
  for update using (
    auth.uid() = guest_id
    or exists (
      select 1 from public.listings l
      where l.id = bookings.listing_id and l.host_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 조회 함수
-- RLS 로 남의 예약은 숨기되, 달력에 필요한 "막힌 날짜"만 노출합니다.
-- ------------------------------------------------------------
create or replace function public.booked_ranges(p_listing_id uuid)
returns table (check_in date, check_out date)
language sql
security definer
stable
set search_path = public
as $$
  select b.check_in, b.check_out
  from public.bookings b
  where b.listing_id = p_listing_id
    and b.status = 'confirmed'
    and b.check_out >= current_date
  order by b.check_in;
$$;

-- 검색: 키워드 + 날짜 + 인원. 날짜가 주어지면 겹치는 예약이 있는 숙소를 제외합니다.
create or replace function public.search_listings(
  p_q         text default null,
  p_check_in  date default null,
  p_check_out date default null,
  p_guests    int  default 1
)
returns setof public.listings
language sql
security definer
stable
set search_path = public
as $$
  select l.*
  from public.listings l
  where l.is_published
    and (
      p_q is null or p_q = ''
      or l.title ilike '%' || p_q || '%'
      or l.address ilike '%' || p_q || '%'
    )
    and l.max_guests >= coalesce(p_guests, 1)
    and (
      p_check_in is null or p_check_out is null or p_check_out <= p_check_in
      or not exists (
        select 1 from public.bookings b
        where b.listing_id = l.id
          and b.status = 'confirmed'
          and b.stay && daterange(p_check_in, p_check_out, '[)')
      )
    )
  order by l.created_at desc
  limit 60;
$$;

grant execute on function public.booked_ranges(uuid) to anon, authenticated;
grant execute on function public.search_listings(text, date, date, int) to anon, authenticated;

-- ------------------------------------------------------------
-- Storage: 숙소 사진 버킷
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "숙소 사진은 누구나 조회" on storage.objects;
create policy "숙소 사진은 누구나 조회" on storage.objects
  for select using (bucket_id = 'listing-images');

-- 경로 규칙: listing-images/{user_id}/{파일명}
drop policy if exists "본인 폴더에만 사진 업로드" on storage.objects;
create policy "본인 폴더에만 사진 업로드" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "본인 사진만 삭제" on storage.objects;
create policy "본인 사진만 삭제" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
