"use client";

import { Pediatrician } from "@/lib/supabase";

export default function PediatricianCard({ doc }: { doc: Pediatrician }) {
  const initials = \`\${doc.first_name?.[0] || ""}\${doc.last_name?.[0] || ""}\`;

  return (
    <a
      href={\`/pediatrician/\${doc.id}\`}
      className="block bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all p-6 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0 group-hover:bg-primary-200 transition-colors">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors truncate">
            Dr. {doc.first_name} {doc.last_name}
          </h3>
          {doc.practice_name && (
            <p className="text-sm text-slate-500 truncate">{doc.practice_name}</p>
          )}
          <p className="text-sm text-slate-600 mt-1">
            {doc.specialty || "Pediatrics"}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="truncate">
              {[doc.city, doc.state].filter(Boolean).join(", ")}
              {doc.zip_code ? \` \${doc.zip_code}\` : ""}
            </span>
          </div>
          {doc.phone && (
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              <span>{doc.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            {doc.accepting_new_patients && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Accepting New Patients
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
