import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { getAllPosts } from "@/lib/blog";

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

  const blogPosts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `https://findmypediatrician.com/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

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
          {
            url: "https://findmypediatrician.com/blog",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          },
          {
            url: "https://findmypediatrician.com/about",
            changeFrequency: "yearly",
            priority: 0.3,
          },
          {
            url: "https://findmypediatrician.com/contact",
            changeFrequency: "yearly",
            priority: 0.3,
          },
          {
            url: "https://findmypediatrician.com/privacy",
            changeFrequency: "yearly",
            priority: 0.3,
          },
          {
            url: "https://findmypediatrician.com/terms",
            changeFrequency: "yearly",
            priority: 0.3,
          },
          ...blogPages,
        ]
      : [];

  // Supabase returns at most 1,000 rows per request, so fetch this chunk in pages.
  const pageSize = 1000;
  const pages = await Promise.all(
    Array.from({ length: perSitemap / pageSize }, (_, i) => {
      const from = start + i * pageSize;
      return supabase
        .from("pediatricians")
        .select("id")
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
    })
  );
  const data = pages.flatMap(({ data }) => data || []);

  const pediatricianPages: MetadataRoute.Sitemap = data.map((doc) => ({
    url: `https://findmypediatrician.com/pediatrician/${doc.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...pediatricianPages];
}
