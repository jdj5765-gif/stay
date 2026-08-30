export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-line p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Supabase 연결이 필요합니다
        </h1>
        <p className="text-muted">
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm">
            .env.local
          </code>{" "}
          이 아직 없습니다. 아래 네 단계를 마치면 화면이 살아납니다.
        </p>
      </div>

      <ol className="space-y-4 text-sm">
        <Step n={1}>
          <a
            href="https://supabase.com/dashboard/projects"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand underline"
          >
            supabase.com/dashboard/projects
          </a>{" "}
          에서 새 프로젝트를 만듭니다.
        </Step>

        <Step n={2}>
          <strong>SQL Editor</strong> 를 열고 프로젝트의{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5">
            supabase/schema.sql
          </code>{" "}
          내용을 통째로 붙여넣어 실행합니다. 테이블·RLS·사진 버킷·검색 함수가 한
          번에 만들어집니다.
        </Step>

        <Step n={3}>
          <strong>Authentication → Sign In / Providers → Email</strong> 에서
          &ldquo;Confirm email&rdquo; 을 끕니다. 개발 중에는 가입 즉시 로그인되는
          편이 편합니다.
        </Step>

        <Step n={4}>
          <code className="rounded bg-black/5 px-1.5 py-0.5">
            .env.local.example
          </code>{" "}
          을{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5">.env.local</code> 로
          복사하고, <strong>Project Settings → API</strong> 의 Project URL 과
          anon public 키를 채운 뒤 개발 서버를 다시 시작합니다.
        </Step>
      </ol>

      <pre className="overflow-x-auto rounded-lg bg-black/5 p-4 text-xs leading-relaxed">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
      </pre>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
