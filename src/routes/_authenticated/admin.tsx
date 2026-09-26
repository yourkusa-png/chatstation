import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { REPORT_REASONS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Moderation · StaticRoom" },
      { name: "description", content: "Review reports and manage bans on StaticRoom." },
      { property: "og:title", content: "Moderation · StaticRoom" },
      { property: "og:description", content: "Review reports and manage bans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_id: string;
  match_id: string | null;
  reason: string;
  details: string;
  status: "open" | "dismissed" | "actioned";
  created_at: string;
};

type BanRow = {
  id: string;
  user_id: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
};

function reasonLabel(value: string) {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

function AdminPage() {
  const { user, isStaff, loading } = useAuth();
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as ReportRow[];
    },
  });

  const bansQuery = useQuery({
    queryKey: ["admin-bans"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as BanRow[];
    },
  });

  const names = useQuery({
    queryKey: ["admin-names", reportsQuery.data?.length, bansQuery.data?.length],
    enabled: isStaff,
    queryFn: async () => {
      const ids = new Set<string>();
      (reportsQuery.data ?? []).forEach((r) => {
        ids.add(r.reporter_id);
        ids.add(r.reported_id);
      });
      (bansQuery.data ?? []).forEach((b) => ids.add(b.user_id));
      if (ids.size === 0) return {} as Record<string, string>;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", [...ids]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: { id: string; display_name: string }) => {
        map[p.id] = p.display_name;
      });
      return map;
    },
  });

  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: isStaff,
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const [{ count: live }, { count: today }, { count: open }] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true }).is("ended_at", null),
        supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .gte("started_at", startOfDay.toISOString()),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
      ]);
      return { live: live ?? 0, today: today ?? 0, open: open ?? 0 };
    },
  });

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-bans"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  async function setStatus(id: string, status: ReportRow["status"]) {
    const { error } = await supabase
      .from("reports")
      .update({ status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAll();
  }

  async function ban(report: ReportRow, hours: number | null) {
    const { error } = await supabase.from("bans").insert({
      user_id: report.reported_id,
      reason: reasonLabel(report.reason),
      expires_at: hours ? new Date(Date.now() + hours * 3600_000).toISOString() : null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await setStatus(report.id, "actioned");
    toast.success(hours ? `Banned for ${hours} hours` : "Banned permanently");
  }

  async function unban(id: string) {
    const { error } = await supabase.from("bans").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAll();
    toast.success("Ban lifted");
  }

  if (loading) return null;

  if (!isStaff) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldOff className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-5 text-2xl font-bold">Moderators only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is reserved for the moderation team.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/chat">Back to chat</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nameOf = (id: string) => names.data?.[id] ?? `${id.slice(0, 8)}…`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <h1 className="text-3xl font-bold">Moderation</h1>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Calls happening now" value={stats.data?.live ?? 0} />
          <Stat label="Matches today" value={stats.data?.today ?? 0} />
          <Stat label="Open reports" value={stats.data?.open ?? 0} />
        </div>

        <Tabs defaultValue="reports" className="mt-8">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="bans">Bans</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {(reportsQuery.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            )}
            {(reportsQuery.data ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge>
                  <span className="text-sm font-medium">{reasonLabel(r.reason)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Reported:</span>{" "}
                  {nameOf(r.reported_id)}{" "}
                  <span className="text-muted-foreground">· by</span> {nameOf(r.reporter_id)}
                </p>
                {r.details && <p className="mt-2 text-sm text-muted-foreground">{r.details}</p>}
                {r.status === "open" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "dismissed")}>
                      Dismiss
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "actioned")}>
                      Warn only
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => ban(r, 24)}>
                      Ban 24h
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => ban(r, null)}>
                      Ban permanently
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="bans" className="mt-4 space-y-3">
            {(bansQuery.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nobody is banned.</p>
            )}
            {(bansQuery.data ?? []).map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium">{nameOf(b.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.reason} ·{" "}
                    {b.expires_at
                      ? `until ${new Date(b.expires_at).toLocaleString()}`
                      : "permanent"}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => unban(b.id)}>
                  Lift ban
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
