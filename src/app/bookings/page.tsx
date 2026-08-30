import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelBooking } from "@/app/actions/bookings";
import { formatDateKo, formatKRW, nightsBetween } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Listing } from "@/lib/types";

type BookingWithListing = Booking & { listings: Listing | null };

export default async function BookingsPage(props: PageProps<"/bookings">) {
  const { highlight } = await props.searchParams;
  const highlighted = typeof highlight === "string" ? highlight : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const { data } = await supabase
    .from("bookings")
    .select("*, listings(*)")
    .eq("guest_id", user.id)
    .order("check_in", { ascending: false });

  const bookings = (data ?? []) as BookingWithListing[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">내 예약</h1>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-line p-12 text-center">
          <p className="text-muted">아직 예약한 숙소가 없습니다.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:opacity-90"
          >
            숙소 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => {
            const listing = booking.listings;
            const nights = nightsBetween(booking.check_in, booking.check_out);

            return (
              <li
                key={booking.id}
                className={`flex gap-4 rounded-xl border p-4 max-sm:flex-col ${
                  booking.id === highlighted
                    ? "border-brand bg-brand/5"
                    : "border-line"
                }`}
              >
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-black/5 max-sm:w-full">
                  {listing?.image_urls[0] && (
                    <Image
                      src={listing.image_urls[0]}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="min-w-0">
                    {listing ? (
                      <Link
                        href={`/listings/${listing.id}`}
                        className="block truncate text-lg font-semibold hover:underline"
                      >
                        {listing.title}
                      </Link>
                    ) : (
                      <p className="text-lg font-semibold text-muted">
                        삭제된 숙소
                      </p>
                    )}
                    <p className="truncate text-sm text-muted">
                      {listing?.address}
                    </p>
                    <p className="mt-2 text-sm">
                      {formatDateKo(booking.check_in)} ~{" "}
                      {formatDateKo(booking.check_out)} · {nights}박 ·{" "}
                      {booking.guests}명
                    </p>
                    <p className="text-sm font-semibold">
                      {formatKRW(booking.total_price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {booking.status === "confirmed" ? (
                      <>
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium">
                          예약 확정
                        </span>
                        <form action={cancelBooking}>
                          <input type="hidden" name="id" value={booking.id} />
                          <button className="text-sm text-muted underline hover:text-brand">
                            예약 취소
                          </button>
                        </form>
                      </>
                    ) : (
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted">
                        취소됨
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
