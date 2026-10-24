import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the FindMyPediatrician directory.",
  alternates: { canonical: "https://www.findmypediatrician.com/terms" },
};

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Use" updated="October 23, 2026">
      <p>By using FindMyPediatrician, you agree to these terms.</p>
      <h2>A directory, not medical advice</h2>
      <p>
        FindMyPediatrician lists pediatricians and practices. It does not give medical advice and
        does not recommend any doctor. Nothing on the site replaces talking to a qualified health
        professional. In an emergency, call 911.
      </p>
      <h2>Listing accuracy</h2>
      <p>
        Listings come from public sources and may be out of date or wrong. Always confirm details
        like address, hours, insurance and whether a practice is taking new patients directly with
        the office.
      </p>
      <h2>No endorsement</h2>
      <p>
        A practice appearing on the site does not mean we endorse it, and we are not responsible
        for the care any provider gives.
      </p>
      <h2>Using the site</h2>
      <p>
        You may use the site for personal, non-commercial purposes. Don&apos;t copy the directory in
        bulk, scrape it, or use it to send unsolicited messages.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms. The date above shows the latest version.</p>
      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </StaticPage>
  );
}
