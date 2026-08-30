import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelBooking } from "@/app/actions/bookings";
import { deleteListing, togglePublished } from "@/app/actions/listings";
import { formatDateKo, formatKRW } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Listing } from "@/lib/types";

export default async function HostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host");

  const { data: listingRows } = await supabase
    .from("listings")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (listingRows ?? []) as Listing[];

  // RLS 덕분에 내 숙소의 예약만 넘어옵니다.
  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("*")
    .in("listing_id", listings.length ? listings.map((l) => l.id) : ["-"])
    .order("check_in", { ascending: true });

  const bookings = (bookingRows ?? []) as Booking[];
  const titleOf = new Map(listings.map((l) => [l.id, l.title]));

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">내 숙소</h1>
          <Link
            href="/host/new"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            새 숙소 등록
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="rounded-xl border border-line p-10 text-center text-muted">
            아직 등록한 숙소가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex items-center gap-4 p-4 max-sm:flex-wrap"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {listing.image_urls[0] && (
                    <Image
                      src={listing.image_urls[0]}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="block truncate font-semibold hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {listing.address} · {formatKRW(listing.price_per_night)}/박
                    {!listing.is_published && " · 비공개"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2 text-sm">
                  <form action={togglePublished}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input
                      type="hidden"
                      name="publish"
                      value={String(!listing.is_published)}
                    />
                    <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-black/5">
                      {listing.is_published ? "비공개로" : "공개로"}
                    </button>
                  </form>
                  <form action={deleteListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button className="rounded-lg border border-line px-3 py-1.5 text-brand hover:bg-black/5">
                      삭제
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">받은 예약</h2>

        {bookings.length === 0 ? (
          <p className="rounded-xl border border-line p-10 text-center text-muted">
            아직 받은 예약이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {titleOf.get(booking.listing_id) ?? "숙소"}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateKo(booking.check_in)} ~{" "}
                    {formatDateKo(booking.check_out)} · {booking.guests}명 ·{" "}
                    {formatKRW(booking.total_price)}
                    {booking.status === "cancelled" && " · 취소됨"}
                  </p>
                </div>
                {booking.status === "confirmed" && (
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={booking.id} />
                    <button className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm text-brand hover:bg-black/5">
                      예약 취소
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
