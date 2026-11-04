import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — CHAT STATION" },
      {
        name: "description",
        content:
          "How to get help or give feedback about CHAT STATION: in-app reporting, the Help Center, privacy questions and abuse reports.",
      },
      { property: "og:title", content: "Contact Us — CHAT STATION" },
      {
        property: "og:description",
        content: "How to reach the CHAT STATION team for help, feedback or abuse reports.",
      },
      { property: "og:url", content: "https://chatstation.in/contact" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">
          We are a small team, so we handle most requests through the app itself. Here is the
          fastest route for each kind of question.
        </p>

        <div className="mt-10 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Someone broke the rules during a call</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the report button during the call — it works even after you skip, if you
              report again right away. Reports are reviewed by a person and action is taken
              against accounts that break the{" "}
              <Link to="/safety" className="text-primary underline underline-offset-4">community rules</Link>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Something is not working</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Camera, microphone and audio problems are almost always covered in the{" "}
              <Link to="/help" className="text-primary underline underline-offset-4">Help Center</Link> —
              start there before writing in.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Account and privacy questions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You can delete your own account at any time from the account menu — no request
              needed. For anything else about your data, read the{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Feedback and business enquiries</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ideas and partnership requests are welcome. A dedicated support inbox is being
              set up and will be published on this page — until then, the in-app report and
              the Help Center are the quickest ways to get an answer.
            </p>
          </div>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
