import { supabase, Pediatrician } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { displayName, initialsFor } from "@/lib/format";

type Props = { params: { slug: string } };

// Parse slug like "atlanta-georgia" into { city: "Atlanta", state: "Georgia" }
function parseSlug(slug: string): { city: string; state: string } | null {
  // US states list for matching
  const states = [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
    "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
    "minnesota","mississippi","missouri","montana","nebraska","nevada",
    "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
    "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
    "south-carolina","south-dakota","tennessee","texas","utah","vermont",
    "virginia","washington","west-virginia","wisconsin","wyoming",
    "district-of-columbia",
  ];

  const parts = slug.toLowerCase().split("-");

  // Try to match state from the end of the slug
  for (let stateWordCount = 1; stateWordCount <= 3; stateWordCount++) {
    if (parts.length <= stateWordCount) continue;
    const stateSlug = parts.slice(-stateWordCount).join("-");
    if (states.includes(stateSlug)) {
      const cityParts = parts.slice(0, -stateWordCount);
      if (cityParts.length === 0) continue;
      const city = cityParts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const state = stateSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return { city, state };
    }
  }
  return null;
}

function slugify(city: string, state: string): string {
  return `${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseSlug(params.slug);
  if (!parsed) return { title: "Pediatricians" };

  const { city, state } = parsed;
  const title = `Pediatricians in ${city}, ${state} - Find a Children's Doctor Near You`;
  const description = `Find pediatricians in ${city}, ${state}. Browse our directory of children's doctors and find addresses, phone numbers and websites. Free pediatrician search.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.findmypediatrician.com/pediatricians/${params.slug}`,
      siteName: "FindMyPediatrician",
    },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://www.findmypediatrician.com/pediatricians/${params.slug}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();

  const { city, state } = parsed;

  // Fetch pediatricians in this city/state
  const { data, error } = await supabase
    .from("pediatricians")
    .select("*")
    .ilike("city", city)
    .ilike("state", state)
    .order("last_name", { ascending: true })
    .limit(100);

  if (error || !data || data.length === 0) notFound();

  const total = data.length;

  // JSON-LD for the city page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `Pediatricians in ${city}, ${state}`,
    description: `Directory of ${total}+ pediatricians in ${city}, ${state}.`,
    url: `https://www.findmypediatrician.com/pediatricians/${params.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: data.slice(0, 10).map((doc, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Physician",
          name: displayName(doc),
          url: `https://www.findmypediatrician.com/pediatrician/${doc.id}`,
          ...(doc.specialty && { medicalSpecialty: doc.specialty }),
          ...(doc.address && {
            address: {
              "@type": "PostalAddress",
              streetAddress: doc.address,
              addressLocality: doc.city,
              addressRegion: doc.state,
              postalCode: doc.zip_code,
              addressCountry: "US",
            },
          }),
          ...(doc.phone && { telephone: doc.phone }),
        },
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findmypediatrician.com/" },
      { "@type": "ListItem", position: 2, name: "Search", item: "https://www.findmypediatrician.com/search" },
      { "@type": "ListItem", position: 3, name: `${city}, ${state}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
        <span>/</span>
        <a href="/search" className="hover:text-primary-600 transition-colors">Search</a>
        <span>/</span>
        <span className="text-slate-900">{city}, {state}</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Pediatricians in {city}, {state}
        </h1>
        <p className="text-slate-600 text-lg max-w-3xl">
          Browse {total}+ pediatricians in {city}, {state}. Find addresses, phone numbers
          and websites, and get directions to each office.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href={`/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Search All in {city}
        </a>
        <a
          href="/map"
          className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
          View on Map
        </a>
      </div>

      {/* Results Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((doc: Pediatrician) => {
          const initials = initialsFor(doc);
          return (
            <a
              key={doc.id}
              href={`/pediatrician/${doc.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                    {displayName(doc)}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.specialty || "Pediatrician"}</p>
                  {doc.address && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{doc.address}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {doc.city}{doc.city && doc.state ? ", " : ""}{doc.state} {doc.zip_code}
                  </p>
                  {doc.phone && (
                    <p className="text-xs text-slate-500 mt-1">{doc.phone}</p>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* SEO content block */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Finding a Pediatrician in {city}, {state}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          Looking for a pediatrician in {city}, {state}? Our directory lists {total}+ pediatricians
          in the {city} area, making it easy to find the right children&apos;s doctor for your family.
          You can search by name and view each
          doctor&apos;s contact information and specialties.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          Use our <a href="/map" className="text-primary-600 hover:text-primary-700 underline">map view</a> to
          find pediatricians near your address in {city}, or <a href="/search" className="text-primary-600 hover:text-primary-700 underline">search
          by ZIP code</a> to find doctors within a specific radius of your location.
        </p>
      </div>
    </div>
  );
}

