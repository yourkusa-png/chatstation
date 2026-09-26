import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · StaticRoom" },
      {
        name: "description",
        content:
          "StaticRoom is free to use. Premium adds gender and country filters, priority matching and no ads.",
      },
      { property: "og:title", content: "Pricing · StaticRoom" },
      {
        property: "og:description",
        content: "Free random video chat, or Premium for filters and priority matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const ROWS = [
  { label: "Random video matching", free: true, premium: true },
  { label: "Live text chat", free: true, premium: true },
  { label: "Report and block", free: true, premium: true },
  { label: "Interest tags", free: "1 tag", premium: "Unlimited" },
  { label: "Filter by gender", free: false, premium: true },
  { label: "Filter by country", free: false, premium: true },
  { label: "Priority in the queue", free: false, premium: true },
  { label: "Ad-free", free: false, premium: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-primary" />;
  if (value === false) return <Minus className="mx-auto size-4 text-muted-foreground/60" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold">Simple plans</h1>
        <p className="mt-3 text-muted-foreground">
          Chatting is free forever. Premium is for people who want control over who they meet.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-7">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to say hello.</p>
            <p className="mt-6 text-4xl font-bold">
              $0<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <Button asChild className="mt-6 w-full" variant="outline">
              <Link to={user ? "/chat" : "/auth"}>Start chatting</Link>
            </Button>
          </div>

          <div className="glow-ring rounded-2xl border border-primary/50 bg-card p-7">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Premium</h2>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Pick who you meet, skip the wait.</p>
            <p className="mt-6 text-4xl font-bold">
              $7.99<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                toast("Premium is not on sale yet", {
                  description: "Card payments will be switched on soon.",
                })
              }
            >
              Upgrade
            </Button>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left">
            <thead className="bg-surface/60 text-sm">
              <tr>
                <th className="px-5 py-3 font-medium">Feature</th>
                <th className="w-28 px-5 py-3 text-center font-medium">Free</th>
                <th className="w-28 px-5 py-3 text-center font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="px-5 py-3 text-sm">{row.label}</td>
                  <td className="px-5 py-3 text-center">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Cell value={row.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
