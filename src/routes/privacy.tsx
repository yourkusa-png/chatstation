import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { TrustFooter } from "@/components/TrustFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CHAT STATION" },
      {
        name: "description",
        content:
          "How CHAT STATION handles your data: what we collect with Google sign-in, how video calls work, cookies, and how to delete your account and data.",
      },
      { property: "og:title", content: "Privacy Policy — CHAT STATION" },
      {
        property: "og:description",
        content: "What CHAT STATION collects, why, and how to delete your account and data.",
      },
      { property: "og:url", content: "https://chatstation.in/privacy" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chatstation.in/privacy" }],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 November 2026</p>
        <p className="mt-4 text-muted-foreground">
          This policy explains what information CHAT STATION (chatstation.in) collects, why we
          collect it, and what you can do about it. We keep it short and in plain language.
        </p>

        <Section title="What we collect">
          <p>
            <strong className="text-foreground">Sign-in data:</strong> when you sign in with
            Google, we receive the name and email address on your Google account so we can
            create your profile and recognise you next time.
          </p>
          <p>
            <strong className="text-foreground">Profile details you add:</strong> your display
            name, optional photo and optional short bio. You choose what appears to the people
            you meet.
          </p>
          <p>
            <strong className="text-foreground">Call records:</strong> we store basic records
            of matches — when a call started, ended, or was skipped — so your history page and
            our abuse moderation can work. We do not record video or audio of calls.
          </p>
          <p>
            <strong className="text-foreground">Reports:</strong> if someone reports you, or
            you report them, we keep the report so a human can review the behaviour.
          </p>
        </Section>

        <Section title="Video and audio calls">
          <p>
            Calls on CHAT STATION are peer-to-peer: your camera and microphone stream go
            directly between the two people in the call. We do not store or record call
            content. A connection needs a small amount of technical routing data (network
            addresses) to be exchanged so the two browsers can find each other — this is how
            all live video calling works.
          </p>
        </Section>

        <Section title="What we do not do">
          <p>
            We do not sell your data, do not post to your Google account, and do not require
            your real name — pick any display name you like.
          </p>
        </Section>

        <Section title="Sign-in sessions">
          <p>
            To keep you signed in, your browser stores a sign-in token in local storage and
            cookies. This is a technical session, not advertising. Clearing your browser data
            signs you out.
          </p>
        </Section>

        <Section title="Third parties">
          <p>
            Google sign-in is provided by Google and is covered by Google's own privacy
            policy. The site and its data are hosted on a managed cloud platform; only the
            CHAT STATION team can access stored data, and only to run and moderate the
            service.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can delete your account at any time: open the account menu in the top bar and
            choose "Delete account permanently". This removes your profile, match history and
            sign-in, and it cannot be undone.
          </p>
        </Section>

        <Section title="Children">
          <p>
            CHAT STATION is strictly for people aged 18 and over. Accounts believed to belong
            to minors are removed.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes in a way that matters, we update this page and the date at
            the top. Questions about privacy can be sent through our{" "}
            <a href="/contact" className="text-primary underline underline-offset-4">contact page</a>.
          </p>
        </Section>
      </main>
      <TrustFooter />
    </div>
  );
}
