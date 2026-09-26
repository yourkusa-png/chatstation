import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, GENDERS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile · StaticRoom" },
      { name: "description", content: "Update how strangers see you on StaticRoom." },
      { property: "og:title", content: "Your profile · StaticRoom" },
      { property: "og:description", content: "Update how strangers see you on StaticRoom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [country, setCountry] = useState("XX");
  const [interests, setInterests] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setGender(profile.gender);
    setCountry(profile.country);
    setInterests((profile.interests ?? []).join(", "));
  }, [profile]);

  const { data: stats } = useQuery({
    queryKey: ["my-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`);
      return { chats: count ?? 0 };
    },
  });

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim().slice(0, 24) || "Stranger",
        gender,
        country,
        interests: interests
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 12),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is what strangers see when you connect.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-2xl font-bold">{stats?.chats ?? 0}</p>
            <p className="text-xs text-muted-foreground">Chats so far</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-2xl font-bold">
              {profile?.is_premium ? "Premium" : "Free"}
            </p>
            <p className="text-xs text-muted-foreground">Current plan</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-2xl font-bold">{profile?.age_confirmed ? "Yes" : "No"}</p>
            <p className="text-xs text-muted-foreground">Age confirmed</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="int">Interests</Label>
            <Input
              id="int"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="music, football, coding"
            />
            <div className="flex flex-wrap gap-1.5">
              {interests
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((i) => (
                  <Badge key={i} variant="secondary">
                    {i}
                  </Badge>
                ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

      </main>
    </div>
  );
}
