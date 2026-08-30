import Image from "next/image";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";
import { createClient } from "@/lib/supabase/server";
import type { BookedRange, Listing } from "@/lib/types";

export default async function ListingPage(props: PageProps<"/listings/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [
    { data: listing },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("listings").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!listing) notFound();
  const item = listing as Listing;

  const [{ data: ranges }, { data: hostProfile }] = await Promise.all([
    supabase.rpc("booked_ranges", { p_listing_id: item.id }),
    supabase.from("profiles").select("name").eq("id", item.host_id).maybeSingle(),
  ]);

  const [cover, ...rest] = item.image_urls;

  return (
    <article className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
        <p className="text-muted">{item.address}</p>
      </header>

      {cover && (
        <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-2">
          <div className="relative aspect-[4/3] bg-black/5 sm:aspect-auto sm:min-h-80">
            <Image
              src={cover}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {rest.slice(0, 4).map((url) => (
                <div key={url} className="relative aspect-[4/3] bg-black/5">
                  <Image
                    src={url}
                    alt={item.title}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-2 border-b border-line pb-6">
            <h2 className="text-xl font-semibold">
              {hostProfile?.name || "호스트"}님이 호스팅하는 숙소
            </h2>
            <p className="text-muted">
              최대 {item.max_guests}명 · 침실 {item.bedrooms}개 · 침대{" "}
              {item.beds}개 · 욕실 {item.baths}개
            </p>
          </section>

          {item.description && (
            <section className="whitespace-pre-wrap leading-relaxed">
              {item.description}
            </section>
          )}

          {!item.is_published && (
            <p className="rounded-lg border border-line bg-black/[0.03] p-4 text-sm text-muted">
              이 숙소는 현재 비공개 상태입니다. 호스트인 나에게만 보입니다.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingForm
            listingId={item.id}
            pricePerNight={item.price_per_night}
            maxGuests={item.max_guests}
            bookedRanges={(ranges ?? []) as BookedRange[]}
            isLoggedIn={Boolean(user)}
            isOwnListing={user?.id === item.host_id}
          />
        </aside>
      </div>
    </article>
  );
}
