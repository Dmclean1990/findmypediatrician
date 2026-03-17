"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Pediatrician } from "@/lib/supabase";
import PediatricianCard from "@/components/PediatricianCard";

const PAGE_SIZE = 20;

// Haversine distance in miles
function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocode a ZIP code using Nominatim
async function geocodeZip(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&postalcode=${encodeURIComponent(zipCode)}`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

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

  const [results, setResults] = useState<(Pediatrician & { distance?: number })[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");
  const [radius, setRadius] = useState(parseInt(searchParams.get("radius") || "0"));
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchMode, setSearchMode] = useState<"filters" | "nearme" | "zip_radius">("filters");

  // Parse the "location" param from homepage
  const locationParam = searchParams.get("location") || "";

  useEffect(() => {
    if (locationParam) {
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

  // Standard filter search
  const fetchResults = useCallback(async () => {
    if (searchMode === "nearme" || searchMode === "zip_radius") return;
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
        setResults((data || []).map(d => ({ ...d })));
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [query, state, city, zip, page, searchMode]);

  // Proximity search (Near Me or ZIP + radius)
  const fetchNearby = useCallback(async (lat: number, lng: number, radiusMiles: number) => {
    setLoading(true);
    try {
      const latDelta = radiusMiles / 69;
      const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));

      const { data, error } = await supabase
        .from("pediatricians")
        .select("*")
        .gte("latitude", lat - latDelta)
        .lte("latitude", lat + latDelta)
        .gte("longitude", lng - lngDelta)
        .lte("longitude", lng + lngDelta)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(500);

      if (error) {
        console.error("Nearby search error:", error);
        setResults([]);
        setTotalCount(0);
      } else {
        const withDistance = (data || [])
          .map((doc: Pediatrician) => ({
            ...doc,
            distance: distanceMiles(lat, lng, doc.latitude!, doc.longitude!),
          }))
          .filter((doc) => doc.distance <= radiusMiles)
          .sort((a, b) => a.distance - b.distance);

        setResults(withDistance);
        setTotalCount(withDistance.length);
      }
    } catch (err) {
      console.error("Nearby search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchMode === "filters") {
      fetchResults();
    }
  }, [fetchResults, searchMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setNearMeActive(false);
    setSearchMode("filters");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (zip) params.set("zip", zip);
    router.push(`/search?${params.toString()}`);
  };

  // Near Me handler using browser geolocation
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setNearMeActive(true);
        setGettingLocation(false);
        setSearchMode("nearme");
        const r = radius || 10;
        setRadius(r);
        fetchNearby(loc.lat, loc.lng, r);
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === 1) {
          setGeoError("Location access denied. Please allow location access in your browser settings.");
        } else {
          setGeoError("Could not determine your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ZIP + radius search
  const handleZipRadiusSearch = async () => {
    if (!zip || !/^\d{5}$/.test(zip.trim())) {
      setGeoError("Please enter a valid 5-digit ZIP code.");
      return;
    }
    if (!radius || radius <= 0) {
      setGeoError("Please select a search radius.");
      return;
    }

    setGeoError("");
    setLoading(true);
    setSearchMode("zip_radius");

    const coords = await geocodeZip(zip.trim());
    if (!coords) {
      setGeoError("Could not find that ZIP code. Please try another.");
      setLoading(false);
      return;
    }

    setUserLocation(coords);
    fetchNearby(coords.lat, coords.lng, radius);
  };

  // Update radius for active proximity search
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation && (searchMode === "nearme" || searchMode === "zip_radius")) {
      fetchNearby(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  const clearNearMe = () => {
    setNearMeActive(false);
    setSearchMode("filters");
    setUserLocation(null);
    setRadius(0);
    setGeoError("");
    fetchResults();
  };

  const totalPages = searchMode === "filters" ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
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

      {/* ZIP + Radius / Near Me Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <input
              type="text"
              placeholder="ZIP code (e.g. 90210)"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              maxLength={5}
            />
            <select
              value={radius || ""}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value) || 0)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Radius</option>
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
              <option value={100}>100 miles</option>
            </select>
            <button
              type="button"
              onClick={handleZipRadiusSearch}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Search by ZIP
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <button
            type="button"
            onClick={nearMeActive ? clearNearMe : handleNearMe}
            disabled={gettingLocation}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${
              nearMeActive
                ? "bg-primary-100 text-primary-700 border border-primary-300 hover:bg-primary-200"
                : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
            } disabled:opacity-50`}
          >
            {gettingLocation ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Getting location...
              </>
            ) : nearMeActive ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
                Near Me On \u2014 Clear
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
                Near Me
              </>
            )}
          </button>
        </div>
        {geoError && (
          <p className="text-red-500 text-sm mt-2">{geoError}</p>
        )}
        {(searchMode === "nearme" || searchMode === "zip_radius") && !loading && (
          <p className="text-primary-600 text-xs mt-2">
            Showing results within {radius} miles{searchMode === "nearme" ? " of your location" : ` of ZIP ${zip}`} \u2014 sorted by distance
          </p>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {loading
            ? "Searching..."
            : `${totalCount.toLocaleString()} Pediatrician${totalCount !== 1 ? "s" : ""} Found`}
        </h1>
        {totalPages > 1 && searchMode === "filters" && (
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
          <p className="text-slate-500">Try adjusting your search filters or increasing the radius.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((doc) => (
            <div key={doc.id} className="relative">
              <PediatricianCard doc={doc} />
              {doc.distance !== undefined && doc.distance !== null && (
                <span className="absolute top-4 right-4 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {doc.distance.toFixed(1)} mi
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination (only for standard filter search) */}
      {totalPages > 1 && searchMode === "filters" && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

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
