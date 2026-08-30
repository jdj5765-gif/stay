import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from '@/lib/supabase/env'

/**
 * Next.js 16 부터 middleware 는 proxy 로 이름이 바뀌었습니다.
 * 여기서 Supabase 세션 토큰을 갱신해 응답 쿠키에 다시 써줍니다.
 * 이게 없으면 일정 시간 뒤 랜덤하게 로그아웃됩니다.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // 환경변수가 없으면 갱신할 세션도 없습니다. 여기서 던지면 전 페이지가 죽습니다.
  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        },
      },
    }
  )

  // 응답이 만들어지기 전에 반드시 한 번 호출해야 토큰 갱신분이 쿠키에 반영됩니다.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
