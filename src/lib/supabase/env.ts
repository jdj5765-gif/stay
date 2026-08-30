export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * 환경변수가 채워졌는지. false 면 Supabase 를 호출하지 않고
 * 화면에 설정 안내를 띄웁니다 (createClient 가 던지는 예외로
 * 전 페이지가 500 이 되는 걸 막습니다).
 */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 0
