import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — CHAT STATION" },
      {
        name: "description",
        content:
          "Answers to common CHAT STATION questions: camera and microphone permissions, black screens, audio problems, skipping, filters, reporting and deleting your account.",
      },
      { property: "og:title", content: "Help Center — CHAT STATION" },
      {
        property: "og:description",
        content: "Fixes for camera, mic and audio problems plus how matching, filters and reporting work.",
      },
      { property: "og:url", content: "https://chatstation.in/help" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/help" }],
  }),
  component: HelpPage,
});

const FAQS = [
  {
    q: "How do I start a video chat?",
    a: "Sign in with Google from the home page, choose 1-to-1 Video, and tap Start Video Chat. You are placed in the queue and paired with the next person who is waiting.",
  },
  {
    q: "Why is my camera or microphone not working?",
    a: "Your browser must be allowed to use the camera and microphone. Tap the lock icon in the browser's address bar, set Camera and Microphone to Allow, and reload the page. On iPhone, check that Settings → Safari (or your browser app) allows camera and microphone access.",
  },
  {
    q: "I see a black screen or 'Connecting…' for a long time. What now?",
    a: "Some networks block direct video connections. Switch between Wi-Fi and mobile data, or move closer to your router, then skip and try again. If it keeps failing, wait a minute and rejoin — the queue pairs you with someone new.",
  },
  {
    q: "I can see the other person but cannot hear them (or the reverse).",
    a: "Check that your phone is not on silent and that the volume is up. During the call, make sure the speaker button is not muted, and that you did not mute yourself or turn off your camera by mistake.",
  },
  {
    q: "How do I skip to the next person?",
    a: "Tap Skip during the call. Both people return to the queue and you are matched with someone new.",
  },
  {
    q: "How do filters work?",
    a: "Premium members can filter matches by gender and country. The filters live in the account menu at the top of the screen.",
  },
  {
    q: "How do I report someone?",
    a: "Tap the report button during the call. This reports the user, skips the call and prevents you being matched with them again. Reports are reviewed and rule-breaking accounts can be banned.",
  },
  {
    q: "Can I use CHAT STATION without installing an app?",
    a: "Yes. It runs entirely in the browser — Chrome, Safari, Firefox or Edge on Android, iPhone, Windows or Mac. There is nothing to download.",
  },
  {
    q: "How do I delete my account?",
    a: "Open the account menu in the top bar and choose 'Delete account permanently'. This removes your profile, match history and sign-in immediately and cannot be undone.",
  },
  {
    q: "Is CHAT STATION free?",
    a: "Yes — video chat, audio chat, rooms and text chat are free. An optional Premium plan with filters and priority matching is planned; see the pricing page.",
  },
];

function HelpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">Help Center</h1>
        <p className="mt-4 text-muted-foreground">
          Quick answers to the questions we hear most. If your problem is not listed, check
          the <Link to="/safety" className="text-primary underline underline-offset-4">safety guidelines</Link> or the{" "}
          <Link to="/contact" className="text-primary underline underline-offset-4">contact page</Link>.
        </p>

        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden sm:text-base">
                <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-3 pl-5 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
