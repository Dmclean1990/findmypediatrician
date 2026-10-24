import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "About",
  description: "FindMyPediatrician is a free directory that helps parents find a pediatrician near them.",
  alternates: { canonical: "https://www.findmypediatrician.com/about" },
};

export default function AboutPage() {
  return (
    <StaticPage title="About FindMyPediatrician">
      <p>
        FindMyPediatrician is a free directory that helps parents find a pediatrician near them.
        Search by city, state or ZIP code, or browse the map, and get each practice&apos;s address,
        phone number and website in one place.
      </p>
      <p>
        Listings come from public sources. We&apos;re working to add the details parents ask about
        most, like whether a practice is taking new patients, which insurance it accepts and the
        languages its doctors speak.
      </p>
      <p>
        Practice details change. Always call the office to confirm before you book a visit.
      </p>
      <p>
        See something wrong, or want to update your practice&apos;s listing?{" "}
        <a href="/contact">Contact us</a>.
      </p>
    </StaticPage>
  );
}
