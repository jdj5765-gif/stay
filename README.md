# stay

숙소를 등록하고 예약하는 에어비앤비형 웹앱. Next.js 16 + Supabase.

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000

Supabase 프로젝트(`stay`, 서울 리전)는 이미 연결돼 있고 `.env.local` 도 채워져 있습니다.
`.env.local` 이 없으면 화면에 설정 안내가 뜹니다 (500 으로 죽지 않습니다).

## Supabase 관리

스키마는 `supabase/migrations/` 로 관리합니다. 대시보드에서 직접 고치지 말고
새 마이그레이션 파일을 추가한 뒤 푸시하세요.

```bash
npx supabase migration new <이름>   # 파일 생성
npx supabase db push                # 원격에 적용
npx supabase config push            # auth 등 프로젝트 설정 적용
```

`supabase/config.toml` 에서 개발 편의를 위해 이메일 확인을 꺼뒀습니다
(`enable_confirmations = false`). 실제로 공개할 때는 `true` 로 되돌리고
`config push` 하세요.

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 숙소 목록 + 지역·날짜·인원 검색 |
| `/listings/[id]` | 숙소 상세 + 예약 |
| `/login` | 로그인 / 회원가입 |
| `/host/new` | 숙소 등록 (사진 업로드 포함) |
| `/host` | 내 숙소 관리 + 받은 예약 |
| `/bookings` | 내 예약 |

## 설계 메모

### 더블부킹은 DB가 막습니다

`bookings.stay` 는 `[체크인, 체크아웃)` 반열림 `daterange` 생성 열이고,
여기에 GiST exclusion 제약이 걸려 있습니다.

```sql
exclude using gist (listing_id with =, stay with &&) where (status = 'confirmed')
```

덕분에 두 사람이 같은 순간에 같은 날짜를 예약해도 한 명만 성공합니다
(실제 API 로 검증: 겹치는 예약은 `23P01` 로 거부, 체크아웃 당일 체크인은 통과).
애플리케이션의 사전 확인(`booked_ranges`)은 UX용이고, 진짜 방어선은 이 제약입니다.
서버 액션은 위반 코드 `23P01` 을 잡아 사용자 문구로 바꿉니다.

반열림 구간이라 8/1~8/3 예약과 8/3~8/5 예약은 공존합니다.
체크아웃 당일에 다음 손님이 들어올 수 있어야 하니까요.

### RLS와 조회 함수

예약 테이블은 게스트 본인과 해당 숙소 호스트만 볼 수 있습니다.
그러면 달력에 "막힌 날짜"를 못 그리므로, 날짜만 돌려주는
`booked_ranges(listing_id)` `security definer` 함수를 따로 뒀습니다.
검색도 같은 이유로 `search_listings(...)` 함수를 씁니다.

### 금액

`total_price` 는 폼 값을 믿지 않고 서버 액션에서 `1박 요금 × 박 수`로 다시 계산합니다.

## 아직 없는 것

결제, 리뷰, 지도, 위시리스트, 호스트-게스트 메시지.
결제를 붙일 때는 `bookings.status` 에 `pending` 을 추가하고
결제 성공 웹훅에서 `confirmed` 로 바꾸는 흐름이 자연스럽습니다.
