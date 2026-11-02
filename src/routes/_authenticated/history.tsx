import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { History, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "My history · CHAT STATION" },
      { name: "description", content: "See your past video chats and calls on CHAT STATION." },
      { property: "og:title", content: "My history · CHAT STATION" },
      { property: "og:description", content: "See your past video chats and calls on CHAT STATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type MatchRow = {
  id: string;
  user_a: string;
  user_b: string;
  started_at: string;
  ended_at: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return null;
  const mins = Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
}

function HistoryPage() {
  const { user } = useAuth();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("matches")
        .select("id, user_a, user_b, started_at, ended_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("started_at", { ascending: false })
        .limit(50);
      return (data ?? []) as MatchRow[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-6 sm:max-w-xl">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <History className="size-5 text-primary" /> My history
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your last 50 matches. For privacy, partner names are never shown here.
        </p>

        {isLoading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !rows || rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No calls yet.</p>
            <Button asChild className="mt-4">
              <a href="/chat">Start your first chat</a>
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {rows.map((m) => {
              const dur = duration(m.started_at, m.ended_at);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <MessageSquare className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatDate(m.started_at)}</p>
                    <p className="text-xs text-muted-foreground">{dur ? `Lasted ${dur}` : "Still active"}</p>
                  </div>
                  {m.ended_at ? (
                    <Badge variant="secondary">Ended</Badge>
                  ) : (
                    <Badge className="bg-destructive text-destructive-foreground">Live</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
