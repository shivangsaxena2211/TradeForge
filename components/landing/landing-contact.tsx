"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LandingContact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      id="contact"
      className="relative z-10 scroll-mt-24 py-20 sm:py-24"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 id="contact-heading" className="text-3xl font-extrabold sm:text-4xl">
          Get in Touch
        </h2>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Questions about the simulation architecture, smart contracts, or
          academic use of DEFINN? Use this form to draft a message locally.
        </p>

        <form
          onSubmit={handleSubmit}
          className="landing-glass mt-10 space-y-6 rounded-3xl p-6 text-left sm:p-10"
          noValidate
        >
          <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-muted-foreground">
            This contact form is visual only. DEFINN does not currently provide a
            backend contact endpoint. Messages are not transmitted or stored.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Name
              </label>
              <Input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Your name"
                className="h-11 border-white/10 bg-black/50"
                disabled={submitted}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="h-11 border-white/10 bg-black/50"
                disabled={submitted}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              placeholder="How can we help?"
              disabled={submitted}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-foreground outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3"
            />
          </div>

          {submitted ? (
            <p
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              role="status"
            >
              Message captured locally for preview only. No message was sent.
            </p>
          ) : (
            <Button
              type="submit"
              className="landing-glow-blue h-12 w-full text-base font-bold shadow-none"
            >
              Preview Submit
            </Button>
          )}
        </form>
      </div>
    </section>
  );
}
