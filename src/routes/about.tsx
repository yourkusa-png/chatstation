import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CHAT STATION — Free Random Video Chat with Strangers" },
      {
        name: "description",
        content:
          "What CHAT STATION is, how random 1-on-1 video matching works, and why it is free. An 18+ Omegle alternative that runs in your browser with Google sign-in.",
      },
      { property: "og:title", content: "About CHAT STATION — Free Random Video Chat with Strangers" },
      {
        property: "og:description",
        content: "How CHAT STATION pairs you with a stranger for a live 1-on-1 video or audio chat — free, instant, skip anytime.",
      },
      { property: "og:url", content: "https://chatstation.in/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">About CHAT STATION</h1>
        <p className="mt-4 text-muted-foreground">
          CHAT STATION is a free random video chat website. Press start, and we pair you with
          another real person who is waiting at the same moment for a 1-on-1 video or audio
          call. If the conversation is not for you, one tap skips to someone new — no coins,
          no queue timers, no app download.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">How matching works</h2>
        <p className="mt-3 text-muted-foreground">
          Everyone who taps start joins a live queue. When two people are waiting, their
          browsers connect directly for a private video call. The call happens between the
          two phones or computers — you can talk, type in the side chat, send a small gift
          emoji, or skip at any time. When one person leaves, both go back to the queue.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Why you need a Google account</h2>
        <p className="mt-3 text-muted-foreground">
          Random chat sites that need no account attract harassment, so CHAT STATION asks you
          to sign in with Google. It takes one tap, we never post anywhere on your behalf,
          and your sign-in lets us show real profiles, keep your match history, and enforce
          the same rules for everyone. The site is strictly for adults aged 18 and over.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">What it costs</h2>
        <p className="mt-3 text-muted-foreground">
          Video chat, audio chat, live rooms and text messaging are free. A Premium plan with
          gender and country filters and priority matching is planned, but the core experience
          stays free. See the <Link to="/pricing" className="text-primary underline underline-offset-4">pricing page</Link> for details.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Who it is for</h2>
        <p className="mt-3 text-muted-foreground">
          People who want to meet someone new — practise a language, cure boredom, or just
          talk to a stranger who does not know you. CHAT STATION is built and hosted in India
          and works on Jio, Airtel and Vi 4G/5G connections as well as Wi-Fi, in any modern
          browser on Android, iPhone or desktop.
        </p>

        <p className="mt-10 text-muted-foreground">
          Read our <Link to="/safety" className="text-primary underline underline-offset-4">safety guidelines</Link> before your first call, and
          check the <Link to="/help" className="text-primary underline underline-offset-4">Help Center</Link> if anything does not work.
        </p>
      </main>
      <TrustFooter />
    </div>
  );
}
