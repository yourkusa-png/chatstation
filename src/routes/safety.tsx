import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety Guidelines — Safe Random Video Chat | CHAT STATION" },
      {
        name: "description",
        content:
          "Community rules and safety tips for random video chat on CHAT STATION: 18+ only, no nudity, protect your personal information, and how report and block work.",
      },
      { property: "og:title", content: "Safety Guidelines — Safe Random Video Chat | CHAT STATION" },
      {
        property: "og:description",
        content: "Community rules and safety tips for random video chat on CHAT STATION.",
      },
      { property: "og:url", content: "https://chatstation.in/safety" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/safety" }],
  }),
  component: SafetyPage,
});

const RULES = [
  {
    title: "18+ only",
    body: "CHAT STATION is strictly for adults. Accounts believed to belong to people under 18 are removed.",
  },
  {
    title: "No nudity or sexual content",
    body: "Keep it clothed and keep it friendly. Nudity, sexual acts and harassment on camera lead to a permanent ban.",
  },
  {
    title: "Never share private details",
    body: "Do not share your address, school, workplace, bank details, OTPs or passwords with a stranger — no matter how friendly the chat feels.",
  },
  {
    title: "Report bad behaviour",
    body: "One button reports a user, skips the call and stops you being matched with them again. Reports are reviewed by people, not just software.",
  },
  {
    title: "Beware of scams",
    body: "Nobody on a random chat should ask you for money, gift cards or account codes. Anyone who does is trying to scam you — report them.",
  },
  {
    title: "Skip freely",
    body: "You never owe anyone a conversation. If something feels off, skip. That is what the button is for.",
  },
];

function SafetyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">Safety Guidelines</h1>
        <p className="mt-4 text-muted-foreground">
          Random video chat is fun when everyone follows the same rules. These are the rules
          of CHAT STATION, and the habits that keep you safe on any stranger chat platform.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {RULES.map((r) => (
            <div key={r.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">{r.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-semibold">If someone makes you uncomfortable</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>Tap the report button during the call — this also skips them immediately.</li>
          <li>You will not be matched with that person again.</li>
          <li>
            If they showed something illegal, or pressured you for money or private photos,
            report again after the call so it reaches moderation faster.
          </li>
        </ol>

        <h2 className="mt-12 text-2xl font-semibold">Protect your privacy on camera</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Anything on your screen or behind you can reveal where you live. Check before joining.</li>
          <li>Use a display name that is not your real name.</li>
          <li>Never move the call to another app where the other person asks for private photos.</li>
          <li>Remember the other person can record their screen — only show what you are happy for the world to see.</li>
        </ul>

        <p className="mt-10 text-muted-foreground">
          Questions about a report or a ban? See the{" "}
          <Link to="/help" className="text-primary underline underline-offset-4">Help Center</Link> or the{" "}
          <Link to="/terms" className="text-primary underline underline-offset-4">Terms &amp; Conditions</Link>.
        </p>
      </main>
      <TrustFooter />
    </div>
  );
}
