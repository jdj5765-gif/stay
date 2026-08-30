"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = { error: null };

export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState(
    mode === "signin" ? signIn : signUp,
    initialState,
  );

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line p-6 shadow-sm">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-black/5 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-md py-2 ${mode === "signin" ? "bg-background shadow" : "text-muted"}`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-md py-2 ${mode === "signup" ? "bg-background shadow" : "text-muted"}`}
        >
          회원가입
        </button>
      </div>

      {/* mode 가 바뀌면 폼 상태를 새로 시작합니다 */}
      <form key={mode} action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />

        {mode === "signup" && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">이름</span>
            <input
              name="name"
              autoComplete="name"
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">이메일</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">비밀번호</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "처리 중…"
            : mode === "signin"
              ? "로그인"
              : "가입하고 시작하기"}
        </button>

        {state.error && (
          <p className="text-sm text-brand" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
