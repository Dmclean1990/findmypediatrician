import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FindMyPediatrician handles information when you use the site.",
  alternates: { canonical: "https://www.findmypediatrician.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" updated="October 23, 2026">
      <p>
        This page explains what information FindMyPediatrician collects when you use the site and
        how it is used.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Searches.</strong> The names, places and ZIP codes you type are used to show
          results.
        </li>
        <li>
          <strong>Your location, if you allow it.</strong> &quot;Near Me&quot; asks your browser
          for your location to find nearby pediatricians. It is used for that search only and is
          not stored.
        </li>
        <li>
          <strong>Messages you send us.</strong> The contact form sends your name, email and
          message to our inbox through FormSubmit, a form delivery service. We use them only to
          reply to you.
        </li>
        <li>
          <strong>Usage data.</strong> We use Google Analytics and Vercel Analytics to see which
          pages are visited and how the site performs. These tools may use cookies and collect
          things like your browser type, device and approximate location.
        </li>
      </ul>
      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t create accounts. We only ask for your name if you contact us.</li>
        <li>We don&apos;t sell your personal information.</li>
      </ul>
      <h2>Other services</h2>
      <p>
        ZIP code searches are looked up with OpenStreetMap&apos;s Nominatim service. Links to
        practice websites and maps take you to sites with their own privacy policies.
      </p>
      <h2>Children</h2>
      <p>The site is meant for parents and caregivers, not for children to use on their own.</p>
      <h2>Contact</h2>
      <p>
        Questions about privacy? Use our <a href="/contact">contact form</a>.
      </p>
    </StaticPage>
  );
}
