import { supabase } from "@/lib/supabase";

// Next.js serves the generateSitemaps() chunks at /sitemap/[id].xml but does not
// create an index at /sitemap.xml, so robots.txt and Search Console get a 404.
// This route is that index. Keep PER_SITEMAP in sync with src/app/sitemap.ts.
const PER_SITEMAP = 45000;
const BASE = "https://findmypediatrician.com";

export const revalidate = 86400;

export async function GET() {
  const { count } = await supabase
    .from("pediatricians")
    .select("*", { count: "exact", head: true });

  const chunks = Math.max(1, Math.ceil((count || 0) / PER_SITEMAP));
  const locs = [
    ...Array.from({ length: chunks }, (_, i) => `${BASE}/sitemap/${i}.xml`),
    `${BASE}/sitemap-cities.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((loc) => `\n  <sitemap><loc>${loc}</loc></sitemap>`)
    .join("")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
