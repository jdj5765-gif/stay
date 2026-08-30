import { todayISO } from "@/lib/dates";

/**
 * GET 폼입니다. 검색 조건이 URL 에 남아야 새로고침·공유·뒤로가기가 자연스럽습니다.
 */
export function SearchBar({
  defaults,
}: {
  defaults: { q: string; checkIn: string; checkOut: string; guests: string };
}) {
  const today = todayISO();

  return (
    <form
      action="/"
      className="grid gap-3 rounded-2xl border border-line p-4 shadow-sm sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
    >
      <label className="block text-sm">
        <span className="mb-1 block font-medium">여행지</span>
        <input
          name="q"
          defaultValue={defaults.q}
          placeholder="지역 또는 숙소 이름"
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">체크인</span>
        <input
          type="date"
          name="check_in"
          min={today}
          defaultValue={defaults.checkIn}
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">체크아웃</span>
        <input
          type="date"
          name="check_out"
          min={today}
          defaultValue={defaults.checkOut}
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
        />
      </label>

      <div className="flex gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">인원</span>
          <input
            type="number"
            name="guests"
            min={1}
            max={30}
            defaultValue={defaults.guests}
            className="w-20 rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          className="h-[42px] self-end rounded-lg bg-brand px-5 font-semibold text-white hover:opacity-90"
        >
          검색
        </button>
      </div>
    </form>
  );
}
