import { supabase, Pediatrician } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("pediatricians")
    .select("first_name, last_name, city, state")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Pediatrician Not Found" };

  return {
    title: `Dr. ${data.first_name} ${data.last_name} - Pediatrician in ${data.city}, ${data.state}`,
    description: `Find contact information and details for Dr. ${data.first_name} ${data.last_name}, a pediatrician in ${data.city}, ${data.state}.`,
  };
}

export default async function PediatricianPage({ params }: Props) {
  const { data: doc, error } = await supabase
    .from("pediatricians")
    .select("*")
    .eq("id", params.id)
    .single<Pediatrician>();

  if (error || !doc) notFound();

  const initials = `${doc.first_name?.[0] || ""}${doc.last_name?.[0] || ""}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
        <span>/</span>
        <a href="/search" className="hover:text-primary-600 transition-colors">Search</a>
        {doc.state && (
          <>
            <span>/</span>
            <a href={`/search?state=${encodeURIComponent(doc.state)}`} className="hover:text-primary-600 transition-colors">
              {doc.state}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-slate-900">Dr. {doc.last_name}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Dr. {doc.first_name} {doc.last_name}
              </h1>
              {doc.practice_name && (
                <p className="text-primary-100 mt-1">{doc.practice_name}</p>
              )}
              <p className="text-primary-200 text-sm mt-1">{doc.specialty || "Pediatrics"}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="grid sm:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                {doc.address && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <div>
                      <p className="text-sm text-slate-900">{doc.address}</p>
                      <p className="text-sm text-slate-600">
                        {[doc.city, doc.state].filter(Boolean).join(", ")} {doc.zip_code}
                      </p>
                    </div>
                  </div>
                )}
                {!doc.address && doc.city && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <p className="text-sm text-slate-900">
                      {[doc.city, doc.state].filter(Boolean).join(", ")} {doc.zip_code}
                    </p>
                  </div>
                )}
                {doc.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <a href={`tel:${doc.phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {doc.phone}
                    </a>
                  </div>
                )}
                {doc.email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <a href={`mailto:${doc.email}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {doc.email}
                    </a>
                  </div>
                )}
                {doc.website && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <a href={doc.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Accepting New Patients</p>
                  <p className="text-sm text-slate-900 mt-0.5">
                    {doc.accepting_new_patients ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-500">Not currently</span>
                    )}
                  </p>
                </div>
                {doc.languages && doc.languages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Languages</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {doc.languages.map((lang) => (
                        <span key={lang} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {doc.insurance_accepted && doc.insurance_accepted.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Insurance Accepted</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {doc.insurance_accepted.map((ins) => (
                        <span key={ins} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">
                          {ins}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {doc.bio && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{doc.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <a
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to search results
        </a>
      </div>
    </div>
  );
}
