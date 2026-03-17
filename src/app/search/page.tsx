"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Pediatrician } from "@/lib/supabase";
import PediatricianCard from "@/components/PediatricianCard";

const PAGE_SIZE = 20;

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 animate-pulse h-24" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-24" />
          ))}
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<Pediatrician[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");

  // Parse the "location" param from homepage
  const locationParam = searchParams.get("location") || "";

  useEffect(() => {
    if (locationParam) {
      // Try to detect if it's a ZIP code
      if (/^\d{5}$/.test(locationParam.trim())) {
        setZip(locationParam.trim());
      } else if (locationParam.includes(",")) {
        const parts = locationParam.split(",").map((s) => s.trim());
        setCity(parts[0]);
        if (parts[1]) setState(parts[1]);
      } else {
        setState(locationParam.trim());
      }
    }
  }, [locationParam]);

  const fetchResults = useCallback(async () => {
    setLoading(true);

    try {
      let dbQuery = supabase.from("pediatricians").select("*", { count: "exact" });

      if (query) {
        dbQuery = dbQuery.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,practice_name.ilike.%${query}%`
        );
      }
      if (state) dbQuery = dbQuery.ilike("state", state);
      if (city) dbQuery = dbQuery.ilike("city", city);
      if (zip) dbQuery = dbQuery.eq("zip_code", zip);

      dbQuery = dbQuery
        .order("last_name", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count, error } = await dbQuery;

      if (error) {
        console.error("Search error:", error);
        setResults([]);
        setTotalCount(0);
      } else {
        setResults(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [query, state, city, zip, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (zip) params.set("zip", zip);
    router.push(`/search?${params.toString()}`);
    fetchResults();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name or Practice
            </label>
            <input
              type="text"
              placeholder="Doctor name or practice..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="e.g. California"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Los Angeles"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {loading
            ? "Searching..."
            : `${totalCount.toLocaleString()} Pediatrician${totalCount !== 1 ? "s" : ""} Found`}
        </h1>
        {totalPages > 1 && (
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages.toLocaleString()}
          </p>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-48" />
                  <div className="h-3 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-200 rounded w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No results found</h3>
          <p className="text-slate-500">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((doc) => (
            <PediatricianCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  page === pageNum
                    ? "bg-primary-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
