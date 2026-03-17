import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-JKLGLLBR7W";

export const metadata: Metadata = {
  title: {
    default: "Find My Pediatrician - Search 129,000+ Pediatricians Near You",
    template: "%s | FindMyPediatrician",
  },
  description:
    "Search our directory of over 129,000 pediatricians across the United States. Find the right children's doctor near you by location, name, ZIP code, or specialty. Free and updated daily.",
  keywords: [
    "pediatrician near me",
    "find pediatrician",
    "children doctor near me",
    "pediatrician directory",
    "pediatrics",
    "kids doctor",
    "child doctor",
    "pediatrician accepting new patients",
    "best pediatrician near me",
  ],
  metadataBase: new URL("https://findmypediatrician.com"),
  openGraph: {
    title: "Find My Pediatrician - Search 129,000+ Pediatricians Near You",
    description:
      "The most comprehensive free directory of pediatricians in the United States. Search by location, ZIP code, or doctor name.",
    url: "https://findmypediatrician.com",
    siteName: "FindMyPediatrician",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find My Pediatrician - Search 129,000+ Pediatricians Near You",
    description:
      "The most comprehensive free directory of pediatricians in the United States.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://findmypediatrician.com",
  },
  verification: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FindMyPediatrician",
              url: "https://findmypediatrician.com",
              description:
                "Search our directory of over 129,000 pediatricians across the United States.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://findmypediatrician.com/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-2">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                  />
                </svg>
                <span className="text-xl font-bold text-slate-900">
                  Find<span className="text-primary-600">My</span>Pediatrician
                </span>
              </a>
              <nav className="hidden sm:flex items-center gap-6">
                <a
                  href="/"
                  className="text-sm text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Home
                </a>
                <a
                  href="/search"
                  className="text-sm text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Search
                </a>
                <a
                  href="/map"
                  className="text-sm text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Map
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm">
                &copy; {new Date().getFullYear()} FindMyPediatrician.com. All
                rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="/search"
                  className="text-sm hover:text-white transition-colors"
                >
                  Search Directory
                </a>
                <a
                  href="/map"
                  className="text-sm hover:text-white transition-colors"
                >
                  Find Nearby
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
