import { supabase } from "@/lib/supabase";

function slugify(city: string, state: string): string {
  return `${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const revalidate = 86400;

// Supabase returns at most 1,000 rows per request, so page through the table,
// a few pages at a time to stay inside the function time limit.
async function fetchAllCityStates() {
  const pageSize = 1000;
  const concurrency = 10;
  const { count } = await supabase
    .from("pediatricians")
    .select("*", { count: "exact", head: true }).is("hidden_reason", null);
  const pages = Math.ceil((count || 0) / pageSize);

  const rows: { city: string | null; state: string | null }[] = [];
  for (let start = 0; start < pages; start += concurrency) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(concurrency, pages - start) }, (_, i) => {
        const from = (start + i) * pageSize;
        return supabase
          .from("pediatricians")
          .select("city, state").is("hidden_reason", null)
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);
      })
    );
    batch.forEach(({ data }) => rows.push(...(data || [])));
  }
  return rows;
}

export async function GET() {
  const data = await fetchAllCityStates();

  const citySet = new Set<string>();
  const cities: { city: string; state: string }[] = [];

  (data || []).forEach((row) => {
    if (row.city && row.state) {
      const key = `${row.city}|${row.state}`;
      if (!citySet.has(key)) {
        citySet.add(key);
        cities.push({ city: row.city, state: row.state });
      }
    }
  });

  const urls = cities
    .map(
      ({ city, state }) => `
  <url>
    <loc>https://www.findmypediatrician.com/pediatricians/${slugify(city, state)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
