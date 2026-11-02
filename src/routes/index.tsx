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
            "Free random video chat with strangers. A modern Omegle and OmeTV alternative.",
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
        <section className="relative border-b border-border">
          <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 sm:max-w-xl">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 rounded-full border border-border bg-card p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setMode("video")}
                className={`flex items-center justify-center gap-2 rounded-full py-2.5 transition-colors ${mode === "video" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                <Video className="size-4" /> Video Chat
              </button>
              <button
                type="button"
                onClick={() => setMode("audio")}
                className={`flex items-center justify-center gap-2 rounded-full py-2.5 transition-colors ${mode === "audio" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                <Mic className="size-4" /> Audio Rooms
              </button>
            </div>

            {/* Preview card */}
            <div className="glow-ring relative mt-5 aspect-[4/5] overflow-hidden rounded-3xl border border-primary/30 bg-surface">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-surface to-accent/25" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="relative">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {mode === "video" ? <Video className="size-8" /> : <Headphones className="size-8" />}
                  </div>
                </div>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                  {mode === "video" ? "Meet someone new." : "Talk with your voice."}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === "video"
                    ? "One-to-one live video with a random person. Skip anytime."
                    : "Voice-only rooms for 5–6 people. Coming soon."}
                </p>
              </div>
              <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <span className="size-2 animate-pulse rounded-full bg-destructive" /> LIVE
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-3 py-1 text-xs backdrop-blur-md">
                  <Globe className="size-3.5" /> Worldwide
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 px-3">
                {["Everyone", "Interests", "Country"].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                    <SlidersHorizontal className="size-3" /> {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Instant match */}
            <div className="mt-5">
              {mode === "audio" ? (
                <Button disabled className="h-16 w-full rounded-2xl text-lg font-bold">
                  <Headphones className="size-5" /> Audio Rooms — Coming soon
                </Button>
              ) : user ? (
                <Button asChild className="glow-ring cta-breathe h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-lg font-bold">
                  <Link to="/chat">
                    <Zap className="size-5" /> Instant Match
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={startWithGoogle}
                  disabled={busy}
                  className="glow-ring cta-breathe h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-lg font-bold"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <Zap className="size-5" />}
                  Instant Match
                </Button>
              )}
              {!user && mode === "video" && (
                <p className="mt-2 text-center text-sm text-muted-foreground">One tap with Google · Free</p>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                18+ only. Be kind — calls can be reported and accounts can be banned.
              </p>
            </div>

            {/* Audio rooms preview */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Audio Rooms</h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Coming soon</span>
              </div>
              <div className="mt-3 grid gap-3">
                {ROOMS.map((r) => (
                  <div key={r.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <r.icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">Up to 6 people · Voice only</p>
                    </div>
                    <Users className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
        <button type="button" onClick={() => { setMode("audio"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground">
          <Headphones className="size-5" /> Rooms
        </button>
        <Link to="/profile" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground">
          <UserRound className="size-5" /> Profile
        </Link>
      </nav>
    </div>
  );
}
