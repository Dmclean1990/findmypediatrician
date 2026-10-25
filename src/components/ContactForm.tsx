"use client";

import { useState } from "react";
import { CONTACT_FORM_ENDPOINT } from "@/lib/site";

const TOPICS = [
  "Fix wrong details on a listing",
  "Add or remove a practice",
  "Question about the site",
  "Something else",
];

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Bots fill the hidden field; people never see it.
    if (data._honey) return;

    setStatus("sending");
    try {
      const res = await fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data,
          _subject: `FindMyPediatrician: ${data.topic}`,
          _template: "table",
          _replyto: data.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === "false" || json.success === false) throw new Error();
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
        Thanks, your message was sent. We&apos;ll get back to you by email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Your name</span>
          <input name="name" required className={inputClass} autoComplete="name" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Your email</span>
          <input name="email" type="email" required className={inputClass} autoComplete="email" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">What is this about?</span>
        <select name="topic" className={inputClass} defaultValue={TOPICS[0]}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">
          Listing link <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <input name="listing" type="url" placeholder="https://www.findmypediatrician.com/pediatrician/..." className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">Message</span>
        <textarea name="message" required rows={5} className={inputClass} />
      </label>
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {status === "error" && (
        <p className="text-sm text-red-600">Sorry, your message didn&apos;t go through. Please try again in a minute.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
