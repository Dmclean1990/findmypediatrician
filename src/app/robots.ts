import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    // The index lists every chunk plus the city sitemap.
    sitemap: "https://findmypediatrician.com/sitemap.xml",
  };
}
