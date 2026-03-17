import { supabase } from "@/lib/supabase";

function slugify(city: string, state: string): string {
  return `${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const { data } = await supabase
    .from("pediatricians")
    .select("city, state")
    .not("city", "is", null)
    .not("state", "is", null);

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
    <loc>https://findmypediatrician.com/pediatricians/${slugify(city, state)}</loc>
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
