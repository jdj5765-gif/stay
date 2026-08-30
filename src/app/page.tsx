import { ListingCard } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
import { isValidISODate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;

  const q = one(searchParams.q).trim();
  const checkInRaw = one(searchParams.check_in);
  const checkOutRaw = one(searchParams.check_out);
  const guestsRaw = one(searchParams.guests);

  // 날짜는 둘 다 유효하고 순서가 맞을 때만 필터로 씁니다.
  const hasRange =
    isValidISODate(checkInRaw) &&
    isValidISODate(checkOutRaw) &&
    checkOutRaw > checkInRaw;
  const guests = Math.min(Math.max(Number(guestsRaw) || 1, 1), 30);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_listings", {
    p_q: q || null,
    p_check_in: hasRange ? checkInRaw : null,
    p_check_out: hasRange ? checkOutRaw : null,
    p_guests: guests,
  });

  const listings = (data ?? []) as Listing[];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          어디로 떠나시나요?
        </h1>
        <SearchBar
          defaults={{
            q,
            checkIn: hasRange ? checkInRaw : "",
            checkOut: hasRange ? checkOutRaw : "",
            guests: String(guests),
          }}
        />
      </section>

      {error ? (
        <p className="rounded-xl border border-line bg-black/[0.02] p-6 text-sm text-muted">
          숙소를 불러오지 못했습니다. Supabase 환경변수와 스키마가 적용됐는지
          확인해 주세요. ({error.message})
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-xl border border-line p-10 text-center text-muted">
          조건에 맞는 숙소가 없습니다.
        </p>
      ) : (
        <section>
          <p className="mb-4 text-sm text-muted">
            숙소 {listings.length}곳
            {hasRange && " · 선택한 날짜에 예약 가능한 곳만 보입니다"}
          </p>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
