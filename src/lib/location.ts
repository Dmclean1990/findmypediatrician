// State names are stored in full ("Florida"), so 2-letter codes must be expanded before querying.
export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida",
  GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};

const NAMES_LOWER = new Map(
  Object.values(STATE_NAMES).map((name) => [name.toLowerCase(), name])
);

// "FL", "fl", "Florida", "florida" -> "Florida". Returns null if it isn't a state.
export function normalizeState(input: string): string | null {
  const s = input.trim().replace(/\.$/, "");
  if (!s) return null;
  if (s.length === 2) return STATE_NAMES[s.toUpperCase()] || null;
  return NAMES_LOWER.get(s.toLowerCase()) || null;
}

export type ParsedLocation = { zip?: string; city?: string; state?: string };

// Parses a free-text location box: "33324", "Plantation, FL", "Plantation, Florida",
// "Plantation FL", "Florida", or "Plantation".
export function parseLocation(input: string): ParsedLocation {
  const s = input.trim();
  if (!s) return {};

  const zipMatch = s.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) return { zip: zipMatch[1] };

  if (s.includes(",")) {
    const [cityPart, statePart = ""] = s.split(",").map((p) => p.trim());
    const state = normalizeState(statePart);
    return { city: cityPart || undefined, state: state || undefined };
  }

  const wholeState = normalizeState(s);
  if (wholeState) return { state: wholeState };

  // "Plantation FL" or "Fort Lauderdale Florida": try the last one or two words as the state.
  const words = s.split(/\s+/);
  for (const n of [2, 1]) {
    if (words.length > n) {
      const state = normalizeState(words.slice(-n).join(" "));
      if (state) return { city: words.slice(0, -n).join(" "), state };
    }
  }

  return { city: s };
}
