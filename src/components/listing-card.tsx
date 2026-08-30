import Image from "next/image";
import Link from "next/link";
import { formatKRW } from "@/lib/dates";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.image_urls[0];

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/5">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            사진 없음
          </div>
        )}
      </div>

      <div className="mt-3 space-y-0.5">
        <h3 className="truncate font-semibold">{listing.title}</h3>
        <p className="truncate text-sm text-muted">{listing.address}</p>
        <p className="text-sm text-muted">
          최대 {listing.max_guests}명 · 침실 {listing.bedrooms} · 욕실{" "}
          {listing.baths}
        </p>
        <p className="pt-1 text-sm">
          <span className="font-semibold">
            {formatKRW(listing.price_per_night)}
          </span>{" "}
          <span className="text-muted">/ 박</span>
        </p>
      </div>
    </Link>
  );
}
