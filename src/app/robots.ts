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
    sitemap: [
      "https://findmypediatrician.com/sitemap.xml",
      "https://findmypediatrician.com/sitemap-cities.xml",
    ],
  };
}
