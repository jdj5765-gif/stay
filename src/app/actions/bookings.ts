'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidISODate, nightsBetween, todayISO } from '@/lib/dates'
import type { ActionState } from '@/lib/types'

/** Postgres exclusion_violation — 같은 숙소·같은 기간에 이미 예약이 있음 */
const EXCLUSION_VIOLATION = '23P01'

export async function createBooking(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const listingId = String(formData.get('listing_id') ?? '')
  const checkIn = String(formData.get('check_in') ?? '')
  const checkOut = String(formData.get('check_out') ?? '')
  const guests = Number(formData.get('guests') ?? 1)

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return { error: '체크인·체크아웃 날짜를 선택해 주세요.' }
  }
  if (checkIn < todayISO()) {
    return { error: '지난 날짜는 예약할 수 없습니다.' }
  }

  const nights = nightsBetween(checkIn, checkOut)
  if (nights < 1) {
    return { error: '체크아웃은 체크인 다음 날 이후여야 합니다.' }
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, host_id, price_per_night, max_guests, is_published')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) return { error: '숙소를 찾을 수 없습니다.' }
  if (!listing.is_published) return { error: '현재 예약을 받지 않는 숙소입니다.' }
  if (listing.host_id === user.id) {
    return { error: '본인이 등록한 숙소는 예약할 수 없습니다.' }
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > listing.max_guests) {
    return { error: `인원은 1명에서 ${listing.max_guests}명 사이여야 합니다.` }
  }

  // 금액은 클라이언트 입력을 믿지 않고 서버에서 다시 계산합니다.
  const totalPrice = listing.price_per_night * nights

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: listing.id,
      guest_id: user.id,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      total_price: totalPrice,
    })
    .select('id')
    .single()

  if (error) {
    // 미리 조회해서 걸러도 동시 요청은 뚫릴 수 있습니다.
    // 최종 방어선은 DB 의 EXCLUDE 제약이고, 여기서 그 위반을 사용자 문구로 바꿉니다.
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: '선택한 날짜에 이미 예약이 있습니다. 다른 날짜를 골라 주세요.' }
    }
    return { error: `예약에 실패했습니다: ${error.message}` }
  }

  revalidatePath(`/listings/${listing.id}`)
  revalidatePath('/bookings')
  redirect(`/bookings?highlight=${booking.id}`)
}

export async function cancelBooking(formData: FormData) {
  const id = String(formData.get('id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !id) return

  // RLS 의 update 정책이 게스트 본인 또는 해당 숙소 호스트만 허용합니다.
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)

  revalidatePath('/bookings')
  revalidatePath('/host')
}
