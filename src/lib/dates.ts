/** YYYY-MM-DD 문자열만 다룹니다. 타임존 때문에 Date 객체로 왕복하지 않습니다. */

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/** 체크아웃 - 체크인 (박 수). 잘못된 입력이면 0. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) return 0
  const ms =
    Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)
  const nights = Math.round(ms / 86_400_000)
  return nights > 0 ? nights : 0
}

export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function formatDateKo(iso: string): string {
  if (!isValidISODate(iso)) return iso
  const [, m, d] = iso.split('-')
  return `${Number(m)}월 ${Number(d)}일`
}

/** [체크인, 체크아웃) 구간끼리 겹치는지. 체크아웃 당일 체크인은 겹치지 않음. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd
}
