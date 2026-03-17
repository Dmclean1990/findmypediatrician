"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, Pediatrician } from "@/lib/supabase";

// Geocoding using free Nominatim API
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`
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

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(Pediatrician & { distance?: number })[]>([]);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(10);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
  }, [leafletLoaded]);

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGettingLocation(false);
        setSearchInput("My Location");
        setSearchCenter({ lat, lng });
        (async () => {
          setLoading(true);
          const latDelta = radius / 69;
          const lngDelta = radius / (69 * Math.cos((lat * Math.PI) / 180));
          const { data, error: dbError } = await supabase
            .from("pediatricians")
            .select("*")
            .gte("latitude", lat - latDelta)
            .lte("latitude", lat + latDelta)
            .gte("longitude", lng - lngDelta)
            .lte("longitude", lng + lngDelta)
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .limit(200);
          if (dbError) {
            setError("Error searching the database.");
            setLoading(false);
            return;
          }
          const withDistance = (data || [])
            .map((doc: Pediatrician) => ({
              ...doc,
              distance: distanceMiles(lat, lng, doc.latitude!, doc.longitude!),
            }))
            .filter((doc) => doc.distance <= radius)
            .sort((a, b) => a.distance - b.distance);
          setResults(withDistance);
          if (mapInstanceRef.current && markersRef.current) {
            const L = (window as any).L;
            markersRef.current.clearLayers();
            const searchIcon = L.divIcon({
              html: '<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              className: "",
            });
            L.marker([lat, lng], { icon: searchIcon })
              .addTo(markersRef.current)
              .bindPopup("<strong>Your location</strong>");
            withDistance.forEach((doc) => {
              if (doc.latitude && doc.longitude) {
                const popupContent = `
                  <div style="min-width:200px">
                    <strong style="font-size:14px">${doc.first_name} ${doc.last_name}</strong>
                    <br/><span style="color:#64748b;font-size:12px">${doc.specialty || "Pediatrician"}</span>
                    ${doc.address ? `<br/><span style="font-size:12px">${doc.address}</span>` : ""}
                    <br/><span style="font-size:12px">${doc.city || ""}${doc.city && doc.state ? ", " : ""}${doc.state || ""} ${doc.zip_code || ""}</span>
                    ${doc.phone ? `<br/><span style="font-size:12px">\u{1F4DE} ${doc.phone}</span>` : ""}
                    <br/><span style="font-size:12px;color:#2563eb">${doc.distance?.toFixed(1)} miles away</span>
                    <br/><a href="/pediatrician/${doc.id}" style="font-size:12px;color:#2563eb;text-decoration:underline">View profile \u2192</a>
                  </div>
                `;
                const docIcon = L.divIcon({
                  html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                  className: "",
                });
                L.marker([doc.latitude, doc.longitude], { icon: docIcon })
                  .addTo(markersRef.current)
                  .bindPopup(popupContent);
              }
            });
            if (withDistance.length > 0) {
              const bounds = L.latLngBounds(withDistance.map((d) => [d.latitude!, d.longitude!]));
              bounds.extend([lat, lng]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            } else {
              mapInstanceRef.current.setView([lat, lng], 12);
            }
          }
          setLoading(false);
        })();
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === 1) {
          setError("Location access denied. Please allow location access in your browser settings.");
        } else {
          setError("Could not determine your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius]);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!searchInput.trim()) return;
      setLoading(true);
      setError("");
      setResults([]);
      const coords = await geocode(searchInput);
      if (!coords) {
        setError("Could not find that location. Try a different address or ZIP code.");
        setLoading(false);
        return;
      }
      setSearchCenter(coords);
      const latDelta = radius / 69;
      const lngDelta = radius / (69 * Math.cos((coords.lat * Math.PI) / 180));
      const { data, error: dbError } = await supabase
        .from("pediatricians")
        .select("*")
        .gte("latitude", coords.lat - latDelta)
        .lte("latitude", coords.lat + latDelta)
        .gte("longitude", coords.lng - lngDelta)
        .lte("longitude", coords.lng + lngDelta)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(200);
      if (dbError) {
        setError("Error searching the database. Please try again.");
        setLoading(false);
        return;
      }
      const withDistance = (data || [])
        .map((doc: Pediatrician) => ({
          ...doc,
          distance: distanceMiles(coords.lat, coords.lng, doc.latitude!, doc.longitude!),
        }))
        .filter((doc) => doc.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
      setResults(withDistance);
      if (mapInstanceRef.current && markersRef.current) {
        const L = (window as any).L;
        markersRef.current.clearLayers();
        const searchIcon = L.divIcon({
          html: '<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          className: "",
        });
        L.marker([coords.lat, coords.lng], { icon: searchIcon })
          .addTo(markersRef.current)
          .bindPopup("<strong>Your search location</strong>");
        withDistance.forEach((doc) => {
          if (doc.latitude && doc.longitude) {
            const popupContent = `
              <div style="min-width:200px">
                <strong style="font-size:14px">${doc.first_name} ${doc.last_name}</strong>
                <br/><span style="color:#64748b;font-size:12px">${doc.specialty || "Pediatrician"}</span>
                ${doc.address ? `<br/><span style="font-size:12px">${doc.address}</span>` : ""}
                <br/><span style="font-size:12px">${doc.city || ""}${doc.city && doc.state ? ", " : ""}${doc.state || ""} ${doc.zip_code || ""}</span>
                ${doc.phone ? `<br/><span style="font-size:12px">\u{1F4DE} ${doc.phone}</span>` : ""}
                <br/><span style="font-size:12px;color:#2563eb">${doc.distance?.toFixed(1)} miles away</span>
                <br/><a href="/pediatrician/${doc.id}" style="font-size:12px;color:#2563eb;text-decoration:underline">View profile \u2192</a>
              </div>
            `;
            const docIcon = L.divIcon({
              html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
              className: "",
            });
            L.marker([doc.latitude, doc.longitude], { icon: docIcon })
              .addTo(markersRef.current)
              .bindPopup(popupContent);
          }
        });
        if (withDistance.length > 0) {
          const bounds = L.latLngBounds(
            withDistance.map((d) => [d.latitude!, d.longitude!])
          );
          bounds.extend([coords.lat, coords.lng]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 12);
        }
      }
      setLoading(false);
    },
    [searchInput, radius]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <input
              type="text"
              placeholder="Enter address, city, or ZIP code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Searching..." : "Find Pediatricians"}
          </button>
          <button
            type="button"
            onClick={handleNearMe}
            disabled={gettingLocation || loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1.5"
          >
            {gettingLocation ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Locating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
                Near Me
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full min-h-[300px]" />
          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="text-slate-500">Loading map...</div>
            </div>
          )}
        </div>
        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white overflow-y-auto max-h-[40vh] lg:max-h-none">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 text-sm">
                  {results.length} pediatrician{results.length !== 1 ? "s" : ""} found nearby
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {results.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/pediatrician/${doc.id}`}
                    className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm truncate">
                          {doc.first_name} {doc.last_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.specialty || "Pediatrician"}
                        </p>
                        {doc.address && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {doc.address}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          {doc.city}{doc.city && doc.state ? ", " : ""}{doc.state} {doc.zip_code}
                        </p>
                        {doc.phone && (
                          <p className="text-xs text-slate-500 mt-0.5">{doc.phone}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block bg-primary-50 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {doc.distance?.toFixed(1)} mi
                        </span>
                        {doc.rating && doc.rating > 0 && (
                          <div className="flex items-center gap-0.5 mt-1 justify-end">
                            <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-slate-500">{doc.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : searchCenter ? (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="text-sm text-slate-500">No pediatricians found within {radius} miles.</p>
                <p className="text-xs text-slate-400 mt-1">Try increasing the search radius.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p className="text-sm text-slate-500">Enter an address or ZIP code to find pediatricians near you.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
