import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact FindMyPediatrician to fix a listing or ask a question.",
  alternates: { canonical: "https://www.findmypediatrician.com/contact" },
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us">
      <p>
        Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>Write to us if you want to:</p>
      <ul>
        <li>Fix wrong details on a listing</li>
        <li>Add or remove a practice</li>
        <li>Ask a question about the site</li>
      </ul>
      <p>
        For a listing, include the page link so we can find it fast.
      </p>
      <p>
        We can&apos;t give medical advice. If your child needs care, call your pediatrician. In an
        emergency, call 911.
      </p>
    </StaticPage>
  );
}
