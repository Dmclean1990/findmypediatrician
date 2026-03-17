import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export async function generateSitemaps() {
  const { count } = await supabase
    .from("pediatricians")
    .select("*", { count: "exact", head: true });

  const total = count || 0;
  const perSitemap = 45000;
  const numSitemaps = Math.ceil(total / perSitemap);

  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const perSitemap = 45000;
  const start = id * perSitemap;

  const staticPages: MetadataRoute.Sitemap =
    id === 0
      ? [
          {
            url: "https://findmypediatrician.com",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
          },
          {
            url: "https://findmypediatrician.com/search",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
          },
          {
            url: "https://findmypediatrician.com/map",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          },
        ]
      : [];

  const { data } = await supabase
    .from("pediatricians")
    .select("id")
    .order("id", { ascending: true })
    .range(start, start + perSitemap - 1);

  const pediatricianPages: MetadataRoute.Sitemap = (data || []).map((doc) => ({
    url: `https://findmypediatrician.com/pediatrician/${doc.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...pediatricianPages];
}
