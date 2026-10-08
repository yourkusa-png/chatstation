import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Radio, Shield, SkipForward, MessageSquare, Globe, Sparkles, Loader2 } from "lucide-react";

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

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
        <section className="grain relative overflow-hidden border-b border-border">
          <div aria-hidden className="hero-blob pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div aria-hidden className="hero-blob pointer-events-none absolute -bottom-24 right-0 size-96 rounded-full bg-accent/20 blur-3xl [animation-delay:-6s]" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="hero-rise text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Live now
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-6xl">
                Talk to a total
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">stranger.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                CHAT STATION drops you straight into a one-to-one video call with somebody else who
                pressed start. Say hi, have a chat, or skip to the next face.
              </p>
              <div className="mt-8">
                {user ? (
                  <Button asChild className="glow-ring cta-breathe h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-lg font-bold sm:w-auto sm:px-10">
                    <Link to="/chat">
                      <span className="size-2.5 animate-pulse rounded-full bg-primary-foreground" />
                      Start Live Video Chat
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={startWithGoogle}
                    disabled={busy}
                    className="glow-ring cta-breathe h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-lg font-bold sm:w-auto sm:px-10"
                  >
                    {busy ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <span className="size-2.5 animate-pulse rounded-full bg-primary-foreground" />
                    )}
                    Start Live Video Chat
                  </Button>
                )}
                {!user && (
                  <p className="mt-3 text-sm text-muted-foreground">One tap with Google · Free</p>
                )}
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                18+ only. Be kind — calls can be reported and accounts can be banned.
              </p>
            </div>

            <div className="hero-float relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="glow-ring relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-primary/30 bg-surface sm:aspect-[4/3]">
                {/* stranger video */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-surface to-accent/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground">
                      ✦
                    </div>
                  </div>
                </div>
                {/* top bar */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                    <span className="size-2 animate-pulse rounded-full bg-destructive" /> LIVE
                  </span>
                  <span className="rounded-full bg-background/60 px-3 py-1 text-xs backdrop-blur-md">🌍 Stranger · 00:42</span>
                </div>
                {/* floating reactions */}
                <span className="hero-rise absolute right-6 top-1/3 text-2xl [animation-delay:0.4s]">❤️</span>
                <span className="hero-rise absolute right-12 top-1/2 text-xl [animation-delay:0.9s]">😂</span>
                <span className="hero-rise absolute left-6 top-1/2 text-xl [animation-delay:1.3s]">👋</span>
                {/* chat bubble */}
                <div className="absolute bottom-20 left-3 max-w-[70%] rounded-2xl rounded-bl-sm bg-background/70 px-3 py-2 text-sm backdrop-blur-md">
                  Hi! Where are you from? 😊
                </div>
                {/* self view */}
                <div className="absolute bottom-20 right-3 h-24 w-20 overflow-hidden rounded-xl border-2 border-primary/60 bg-gradient-to-br from-accent/40 to-primary/40 shadow-lg" />
                {/* controls */}
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-background/70 backdrop-blur-md"><MessageSquare className="size-5" /></span>
                  <span className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-bold text-primary-foreground"><SkipForward className="size-4" /> Next</span>
                  <span className="flex size-11 items-center justify-center rounded-full bg-background/70 backdrop-blur-md"><Radio className="size-5 text-primary" /></span>
                </div>
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
    </div>
  );
}
