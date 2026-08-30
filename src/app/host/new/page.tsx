import { redirect } from "next/navigation";
import { ListingForm } from "./listing-form";
import { getUser } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/host/new");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">숙소 등록하기</h1>
        <p className="text-muted">
          등록하면 바로 공개되고, 다른 사용자가 예약할 수 있습니다.
        </p>
      </header>
      <ListingForm userId={user.id} />
    </div>
  );
}
