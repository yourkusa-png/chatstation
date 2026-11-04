import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CHAT STATION" },
      {
        name: "description",
        content:
          "The rules for using CHAT STATION: 18+ only, acceptable behaviour on random video calls, moderation, Premium plans, and your responsibilities as a user.",
      },
      { property: "og:title", content: "Terms & Conditions — CHAT STATION" },
      {
        property: "og:description",
        content: "The rules for using CHAT STATION's free random video chat service.",
      },
      { property: "og:url", content: "https://chatstation.in/terms" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/terms" }],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 November 2026</p>
        <p className="mt-4 text-muted-foreground">
          By using CHAT STATION (chatstation.in) you agree to these terms. If you do not
          agree, please do not use the service.
        </p>

        <Section title="1. Who can use CHAT STATION">
          <p>
            You must be at least 18 years old to create an account or join a call. You must
            sign in with a Google account that belongs to you. One person may hold one
            account; creating extra accounts to evade a ban is not allowed.
          </p>
        </Section>

        <Section title="2. Acceptable behaviour">
          <p>
            CHAT STATION exists for friendly conversation between strangers. You agree not
            to:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Show nudity or sexual acts on camera, or stream pre-recorded or fake video.</li>
            <li>Harass, threaten, abuse, stalk or deliberately disgust other users.</li>
            <li>Share content that is illegal, hateful, or that exploits minors.</li>
            <li>Ask for or share passwords, bank details, OTPs or payment information.</li>
            <li>Attempt to scam, phish or defraud other users.</li>
            <li>Record or redistribute another person's video without their consent.</li>
            <li>Use bots, scripts or automated tools to occupy the matching queue.</li>
          </ul>
        </Section>

        <Section title="3. Moderation">
          <p>
            Users can report calls that break these rules. Reports are reviewed and accounts
            can be suspended or permanently banned. Serious violations may also be reported
            to the relevant authorities.
          </p>
        </Section>

        <Section title="4. Your content and conduct">
          <p>
            You are responsible for everything you say, show and share during a call. Calls
            are live and peer-to-peer between participants; we do not record them, but
            anything you show on camera can be captured by the other person, so share
            carefully.
          </p>
        </Section>

        <Section title="5. Premium plans">
          <p>
            The core service is free. Optional Premium features (such as gender and country
            filters and priority matching) may be offered for a recurring fee, with the price
            shown before any purchase. Premium purchases are cancellable and refund terms
            will be shown at checkout where payments are available.
          </p>
        </Section>

        <Section title="6. Availability">
          <p>
            We aim to keep CHAT STATION available at all times, but the service is provided
            "as is". We do not guarantee that a match will always be found, that every user
            follows the rules, or that the service will be uninterrupted or error-free.
          </p>
        </Section>

        <Section title="7. Suspension and termination">
          <p>
            We may suspend or delete an account that breaks these terms, at our discretion.
            You can delete your own account at any time from the account menu.
          </p>
        </Section>

        <Section title="8. Changes">
          <p>
            These terms may be updated as the service grows. The date at the top shows when
            they were last revised, and continued use means you accept the current version.
          </p>
        </Section>
      </main>
      <TrustFooter />
    </div>
  );
}
