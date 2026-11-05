import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Radio, Shield, SkipForward, MessageSquare, Globe, Sparkles, Loader2,
  Video, Mic, Headphones, SlidersHorizontal, Zap, Users, Music, Gamepad2, Coffee,
  Home, UserRound,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeHero } from "@/components/HomeHero";
import { useAuth } from "@/hooks/useAuth";
import { SEO_TOPICS } from "@/data/seo-topics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHAT STATION — Start Live Video Chat with Strangers Free | Omegle & OmeTV Alternative" },
      {
        name: "description",
        content:
          "Talk to random strangers instantly on free 1-on-1 live video chat. No download needed. Country & gender filters, text chat, GIFs. Start on CHAT STATION now.",
      },
      {
        name: "keywords",
        content:
          "live video chat, random video chat, omegle alternative, ometv alternative, talk to strangers, random video call india, free video chat, stranger cam chat, chat station",
      },
      { property: "og:title", content: "CHAT STATION — Free Random Video Chat with Strangers" },
      {
        property: "og:description",
        content: "Meet new people worldwide on live 1-on-1 video calls. Free, instant, skip anytime.",
      },
      { property: "og:url", content: "https://chatstation.in/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "CHAT STATION",
          url: "https://chatstation.in/",
          applicationCategory: "CommunicationApplication",
          operatingSystem: "Web, Android, iOS",
          description:
            "Free random video and audio chat with strangers in India and the USA. A modern 18+ Omegle and OmeTV alternative.",
          inLanguage: ["en", "hi"],
          areaServed: [
            { "@type": "Country", name: "India" },
            { "@type": "Country", name: "United States" },
          ],
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        }),
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Radio,
    title: "Instant pairing",
    body: "Hit start and you are matched with someone else waiting, usually in seconds.",
  },
  {
    icon: SkipForward,
    title: "Skip freely",
    body: "Not clicking? One tap drops the call and finds you a completely new person.",
  },
  {
    icon: MessageSquare,
    title: "Talk or type",
    body: "A live text panel sits beside the video, with a typing indicator for both sides.",
  },
  {
    icon: Globe,
    title: "Interest matching",
    body: "Add tags like music, football or coding and we pair you with people who share them.",
  },
  {
    icon: Shield,
    title: "Report and block",
    body: "One button reports bad behaviour, skips the person and stops you meeting again.",
  },
  {
    icon: Sparkles,
    title: "Premium filters",
    body: "Choose who you meet by gender and country, and jump the queue.",
  },
];

const ROOMS = [
  { icon: Music, title: "Music & Chill" },
  { icon: Gamepad2, title: "Gaming Talk" },
  { icon: Coffee, title: "Late Night Chat" },
];

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"video" | "audio">("video");

  async function startWithGoogle() {
    setBusy(true);
    try {
      const isLovableHost = /(^|\.)lovable\.app$/.test(window.location.hostname);
      if (isLovableHost) {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: `${window.location.origin}/chat`,
        });
        if (result.error) {
          toast.error("Google sign-in failed. Please try again.");
          return;
        }
        if (result.redirected) return;
        navigate({ to: "/chat" });
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/chat` },
      });
      if (error) toast.error("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <HomeHero signedIn={!!user} busy={busy} onGoogle={startWithGoogle} mode={mode} setMode={setMode} />

        <section className="mx-auto w-full max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold">Everything in the room</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold">House rules</h2>
            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="rounded-lg border border-border bg-card p-4">
                You must be 18 or older to use CHAT STATION.
              </li>
              <li className="rounded-lg border border-border bg-card p-4">
                No nudity, sexual content or harassment on camera.
              </li>
              <li className="rounded-lg border border-border bg-card p-4">
                Never share your address, bank details or passwords.
              </li>
              <li className="rounded-lg border border-border bg-card p-4">
                Reported accounts are reviewed and can be banned permanently.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-10 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Random video chat in India</h2>
            <p className="mt-2">
              CHAT STATION is a free stranger video chat built for India. Talk in Hindi, Hinglish or English
              with people from Delhi, Mumbai, Bihar, Punjab and every state. It runs in the browser on Jio, Airtel
              and Vi 4G/5G, so there is no app download and no coins needed to start.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Talk to strangers in the USA</h2>
            <p className="mt-2">
              Meet people from the United States, UK and around the world on one-to-one video or audio calls.
              Practice English, make new friends and skip anytime. CHAT STATION is an 18+ Omegle alternative with
              Google sign-in, report and block tools to keep the community safe.
            </p>
          </div>
        </section>
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pt-8 text-xs">
          {SEO_TOPICS.map((s) => (
            <Link key={s.slug} to="/topics/$slug" params={{ slug: s.slug }} className="capitalize text-muted-foreground hover:text-foreground">
              {s.keyword} ·
            </Link>
          ))}
        </nav>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} CHAT STATION</span>
          <Link to="/pricing" className="ml-auto hover:text-foreground">
            Pricing
          </Link>
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>

      <div className="h-16 sm:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/90 backdrop-blur sm:hidden">
        <Link to="/" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-primary">
          <Home className="size-5" /> Home
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground">
          <Video className="size-5" /> Video
        </Link>
        <Link to="/live" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground">
          <Radio className="size-5 text-destructive" /> Live
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground">
          <UserRound className="size-5" /> Profile
        </Link>
      </nav>
    </div>
  );
}
