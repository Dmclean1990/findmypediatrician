import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact FindMyPediatrician to fix a listing or ask a question.",
  alternates: { canonical: "https://www.findmypediatrician.com/contact" },
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us">
      <p>
        Use the form to fix a listing, add or remove a practice, or ask a question. For a listing,
        paste the page link so we can find it fast.
      </p>
      <ContactForm />
      <p className="text-sm text-slate-500">
        We can&apos;t give medical advice. If your child needs care, call your pediatrician. In an
        emergency, call 911.
      </p>
    </StaticPage>
  );
}
