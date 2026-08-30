import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env'

/**
 * 서버 컴포넌트 / 서버 액션용 Supabase 클라이언트.
 * 요청마다 새로 만들어야 합니다 (모듈 레벨에 캐시하지 마세요).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다.
            // 세션 갱신은 proxy.ts 가 담당하므로 무시해도 안전합니다.
          }
        },
      },
    }
  )
}

/** 로그인한 사용자를 반환합니다. 비로그인이거나 미설정이면 null. */
export async function getUser() {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
