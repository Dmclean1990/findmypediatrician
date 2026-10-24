import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";

// Used if the count query fails, so pages still render.
const FALLBACK_COUNT = 100000;

const getListingCount = unstable_cache(
  async () => {
    const { count, error } = await supabase
      .from("pediatricians")
      .select("*", { count: "exact", head: true }).is("hidden_reason", null);
    if (error || !count) return FALLBACK_COUNT;
    return count;
  },
  ["listing-count"],
  { revalidate: 86400 }
);

// e.g. 129,895 -> "129,000"
export async function getListingCountLabel(): Promise<string> {
  const count = await getListingCount();
  const rounded = count >= 1000 ? Math.floor(count / 1000) * 1000 : count;
  return rounded.toLocaleString("en-US");
}
