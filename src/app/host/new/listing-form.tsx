"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { createListing } from "@/app/actions/listings";
import { createClient } from "@/lib/supabase/client";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = { error: null };
const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

export function ListingForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    createListing,
    initialState,
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const room = MAX_IMAGES - imageUrls.length;
    if (room <= 0) {
      setUploadError(`사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있습니다.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      if (file.size > MAX_BYTES) {
        setUploadError(`${file.name}: 5MB 이하만 올릴 수 있습니다.`);
        continue;
      }

      // Storage 정책이 {user_id}/ 폴더만 허용합니다.
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type });

      if (error) {
        setUploadError(`업로드 실패: ${error.message}`);
        continue;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setImageUrls((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-6">
      {imageUrls.map((url) => (
        <input key={url} type="hidden" name="image_urls" value={url} />
      ))}

      <Field label="숙소 이름" hint="예: 한강이 보이는 조용한 원룸">
        <input
          name="title"
          required
          minLength={2}
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <Field label="주소" hint="예: 서울 마포구 연남동">
        <input name="address" required className={inputClass} />
      </Field>

      <Field label="숙소 소개">
        <textarea name="description" rows={5} className={inputClass} />
      </Field>

      <Field label="1박 요금 (원)">
        <input
          type="number"
          name="price_per_night"
          required
          min={1000}
          step={1000}
          defaultValue={80000}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="최대 인원">
          <input
            type="number"
            name="max_guests"
            min={1}
            max={30}
            defaultValue={2}
            className={inputClass}
          />
        </Field>
        <Field label="침실">
          <input
            type="number"
            name="bedrooms"
            min={0}
            defaultValue={1}
            className={inputClass}
          />
        </Field>
        <Field label="침대">
          <input
            type="number"
            name="beds"
            min={0}
            defaultValue={1}
            className={inputClass}
          />
        </Field>
        <Field label="욕실">
          <input
            type="number"
            name="baths"
            min={0}
            defaultValue={1}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          사진{" "}
          <span className="text-muted">
            ({imageUrls.length}/{MAX_IMAGES})
          </span>
        </p>

        {imageUrls.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {imageUrls.map((url) => (
              <li key={url} className="group relative aspect-square">
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="20vw"
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImageUrls((prev) => prev.filter((u) => u !== url))
                  }
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || imageUrls.length >= MAX_IMAGES}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-background file:px-4 file:py-2 file:text-sm file:font-medium"
        />
        {uploading && <p className="text-sm text-muted">업로드 중…</p>}
        {uploadError && <p className="text-sm text-brand">{uploadError}</p>}
      </div>

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "등록 중…" : "숙소 등록하기"}
      </button>

      {state.error && (
        <p className="text-sm text-brand" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-foreground";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
