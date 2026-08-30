'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/types'

function toInt(value: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(value ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function createListing(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 서버 액션은 UI를 거치지 않고 POST로 직접 호출될 수 있으므로 매번 확인합니다.
  if (!user) return { error: '로그인이 필요합니다.' }

  const title = String(formData.get('title') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const pricePerNight = toInt(formData.get('price_per_night'), 0)

  if (title.length < 2) return { error: '숙소 이름을 2자 이상 입력해 주세요.' }
  if (!address) return { error: '주소를 입력해 주세요.' }
  if (pricePerNight <= 0) return { error: '1박 요금을 입력해 주세요.' }

  const imageUrls = formData
    .getAll('image_urls')
    .map((v) => String(v))
    .filter((v) => v.startsWith('http'))

  const { data, error } = await supabase
    .from('listings')
    .insert({
      host_id: user.id,
      title,
      address,
      description,
      price_per_night: pricePerNight,
      max_guests: toInt(formData.get('max_guests'), 2),
      bedrooms: toInt(formData.get('bedrooms'), 1),
      beds: toInt(formData.get('beds'), 1),
      baths: toInt(formData.get('baths'), 1),
      image_urls: imageUrls,
    })
    .select('id')
    .single()

  if (error) return { error: `숙소 등록에 실패했습니다: ${error.message}` }

  revalidatePath('/')
  revalidatePath('/host')
  redirect(`/listings/${data.id}`)
}

export async function togglePublished(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const publish = String(formData.get('publish') ?? '') === 'true'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !id) return

  // RLS 로도 막히지만, host_id 조건을 명시해 의도를 드러냅니다.
  await supabase
    .from('listings')
    .update({ is_published: publish })
    .eq('id', id)
    .eq('host_id', user.id)

  revalidatePath('/')
  revalidatePath('/host')
}

export async function deleteListing(formData: FormData) {
  const id = String(formData.get('id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !id) return

  await supabase.from('listings').delete().eq('id', id).eq('host_id', user.id)

  revalidatePath('/')
  revalidatePath('/host')
}
