import type { Pediatrician } from "@/lib/supabase";

type NameFields = Pick<Pediatrician, "first_name" | "last_name"> & { full_name?: string | null };

// Listing names came from Google Maps titles, so many are practices ("Penn Highlands
// Pediatrics") or already start with "Dr.". Only people get the "Dr." prefix.
const PRACTICE_WORDS =
  /\b(pediatrics?|pediatric|peds|clinic|clinics|center|centre|centers|group|associates|medical|medicine|health|healthcare|care|hospital|inc|llc|pllc|pa|pc|ltd|practice|partners|family|children'?s?|kids|office|services|physicians|doctors|network|institute|wellness|urgent|university|foundation|department|dept|associates?)\b|[:&@]/i;

export function displayName(doc: NameFields): string {
  const raw = (doc.full_name || `${doc.first_name || ""} ${doc.last_name || ""}`)
    .replace(/\s+/g, " ")
    .trim();
  const withoutTitle = raw.replace(/^dr\.?\s+/i, "").trim();

  if (!withoutTitle) return raw || "Unnamed listing";
  // A single word ("UrgentMed") is a brand or a bare surname, so don't guess "Dr.".
  if (PRACTICE_WORDS.test(withoutTitle) || !withoutTitle.includes(" ")) return withoutTitle;
  return `Dr. ${withoutTitle}`;
}

export function initialsFor(doc: NameFields): string {
  const words = displayName(doc)
    .replace(/^Dr\.\s+/, "")
    .split(/\s+/)
    .filter((w) => /^[a-z]/i.test(w));
  const first = words[0]?.[0] || "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

// specialty holds a comma-separated list of Google categories, e.g.
// "Pediatrician, Internist, Practitioner service location". Use the first one.
export function primarySpecialty(specialty: string | null | undefined): string {
  const first = (specialty || "").split(",")[0]?.trim();
  return first || "Pediatrician";
}
