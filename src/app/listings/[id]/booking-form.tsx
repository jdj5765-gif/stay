"use client";

import { useActionState, useState } from "react";
import { createBooking } from "@/app/actions/bookings";
import {
  formatDateKo,
  formatKRW,
  nightsBetween,
  rangesOverlap,
  todayISO,
} from "@/lib/dates";
import type { ActionState, BookedRange } from "@/lib/types";

const initialState: ActionState = { error: null };

export function BookingForm({
  listingId,
  pricePerNight,
  maxGuests,
  bookedRanges,
  isLoggedIn,
  isOwnListing,
}: {
  listingId: string;
  pricePerNight: number;
  maxGuests: number;
  bookedRanges: BookedRange[];
  isLoggedIn: boolean;
  isOwnListing: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const today = todayISO();
  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * pricePerNight;

  // 서버와 DB가 최종 판정을 하지만, 누르기 전에 알려주는 편이 낫습니다.
  const conflict =
    nights > 0 &&
    bookedRanges.some((r) =>
      rangesOverlap(checkIn, checkOut, r.check_in, r.check_out),
    );

  const blocking = isOwnListing
    ? "본인이 등록한 숙소는 예약할 수 없습니다."
    : conflict
      ? "선택한 날짜에 이미 예약이 있습니다."
      : null;

  return (
    <div className="rounded-2xl border border-line p-5 shadow-lg">
      <p className="mb-4">
        <span className="text-xl font-semibold">{formatKRW(pricePerNight)}</span>
        <span className="text-muted"> / 박</span>
      </p>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="listing_id" value={listingId} />

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
          <label className="border-r border-line p-3 text-xs">
            <span className="mb-1 block font-semibold uppercase">체크인</span>
            <input
              type="date"
              name="check_in"
              required
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && checkOut <= e.target.value) setCheckOut("");
              }}
              className="w-full text-sm outline-none"
            />
          </label>
          <label className="p-3 text-xs">
            <span className="mb-1 block font-semibold uppercase">체크아웃</span>
            <input
              type="date"
              name="check_out"
              required
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </label>
        </div>

        <label className="block rounded-lg border border-line p-3 text-xs">
          <span className="mb-1 block font-semibold uppercase">인원</span>
          <input
            type="number"
            name="guests"
            min={1}
            max={maxGuests}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full text-sm outline-none"
          />
        </label>

        {isLoggedIn ? (
          <button
            type="submit"
            disabled={pending || nights === 0 || Boolean(blocking)}
            className="w-full rounded-lg bg-brand py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "예약하는 중…" : "예약하기"}
          </button>
        ) : (
          <a
            href={`/login?next=/listings/${listingId}`}
            className="block w-full rounded-lg bg-brand py-3 text-center font-semibold text-white hover:opacity-90"
          >
            로그인하고 예약하기
          </a>
        )}
      </form>

      {blocking && <p className="mt-3 text-sm text-brand">{blocking}</p>}
      {state.error && <p className="mt-3 text-sm text-brand">{state.error}</p>}

      {nights > 0 && !blocking && (
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <dt>
              {formatKRW(pricePerNight)} × {nights}박
            </dt>
            <dd>{formatKRW(total)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>총 합계</dt>
            <dd>{formatKRW(total)}</dd>
          </div>
        </dl>
      )}

      {bookedRanges.length > 0 && (
        <div className="mt-4 border-t border-line pt-4 text-sm text-muted">
          <p className="mb-1 font-medium text-foreground">예약된 날짜</p>
          <ul className="space-y-0.5">
            {bookedRanges.slice(0, 5).map((r) => (
              <li key={`${r.check_in}-${r.check_out}`}>
                {formatDateKo(r.check_in)} ~ {formatDateKo(r.check_out)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
