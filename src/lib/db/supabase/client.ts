import { UpayMOM } from "@/lib/db/upay.types";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient<UpayMOM>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
