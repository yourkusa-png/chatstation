import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { clearAvatarCache, fileToAvatarBlob, getAvatarUrl } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile · CHAT STATION" },
      { name: "description", content: "Update how strangers see you on CHAT STATION." },
      { property: "og:title", content: "Your profile · CHAT STATION" },
      { property: "og:description", content: "Update how strangers see you on CHAT STATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [country, setCountry] = useState("XX");
  const [interests, setInterests] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setBio(profile.bio ?? "");
    setGender(profile.gender);
    setCountry(profile.country);
    setInterests((profile.interests ?? []).join(", "));
    void getAvatarUrl(profile.avatar_url).then((u) => setAvatarUrl(u));
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

  const { data: social } = useQuery({
    queryKey: ["my-social", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("followed_id", user!.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user!.id),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
  });

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim().slice(0, 24) || "Stranger",
        bio: bio.trim().slice(0, 200),
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

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photo file.");
      return;
    }
    setUploading(true);
    try {
      const blob = await fileToAvatarBlob(file);
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const reference = `${path}?v=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: reference })
        .eq("id", user.id);
      if (updateError) throw updateError;
      clearAvatarCache();
      const url = await getAvatarUrl(reference);
      setAvatarUrl(url);
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload the photo");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user) return;
    setUploading(true);
    try {
      await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      clearAvatarCache();
      setAvatarUrl(null);
      await refreshProfile();
      toast.success("Profile photo removed");
    } finally {
      setUploading(false);
    }
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
            <p className="text-2xl font-bold">{social?.followers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-2xl font-bold">{social?.following ?? 0}</p>
            <p className="text-xs text-muted-foreground">Following</p>
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
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-20 rounded-full border-2 border-primary/50 object-cover" />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-2xl font-bold text-muted-foreground">
                  {(displayName || "S").charAt(0).toUpperCase()}
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Camera className="size-4" /> Upload photo
              </Button>
              {avatarUrl && (
                <Button variant="ghost" size="sm" onClick={() => void removeAvatar()} disabled={uploading}>
                  <Trash2 className="size-4" /> Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG or PNG · auto-resized</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line about you — strangers see this before the call starts."
              maxLength={200}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/200</p>
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

      </main>
    </div>
  );
}
