import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  Flag,
  Play,
  Square,
  Send,
  Lock,
  Loader2,
  User,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { useRandomChat } from "@/hooks/useRandomChat";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, GENDERS, REPORT_REASONS, countryLabel, genderLabel } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Video chat · StaticRoom" },
      { name: "description", content: "Your live random video chat room on StaticRoom." },
      { property: "og:title", content: "Video chat · StaticRoom" },
      { property: "og:description", content: "Your live random video chat room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const ANY = "__any__";

function ChatPage() {
  const { user, profile, refreshProfile } = useAuth();
  const chat = useRandomChat();

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [interestText, setInterestText] = useState("");
  const [wantGender, setWantGender] = useState<string>(ANY);
  const [wantCountry, setWantCountry] = useState<string>(ANY);
  const [draft, setDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [confirming, setConfirming] = useState(false);

  const isPremium = profile?.is_premium ?? false;

  const { data: ban } = useQuery({
    queryKey: ["my-ban", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (!row) return null;
      if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
      return row;
    },
  });

  useEffect(() => {
    if (localRef.current && chat.localStream) localRef.current.srcObject = chat.localStream;
  }, [chat.localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = chat.remoteStream;
  }, [chat.remoteStream]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.partnerTyping]);

  useEffect(() => {
    if (chat.error) toast.error(chat.error);
  }, [chat.error]);

  useEffect(() => {
    if (profile?.interests?.length) setInterestText(profile.interests.join(", "));
  }, [profile?.interests]);

  const interests = interestText
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, isPremium ? 12 : 1);

  async function confirmAge() {
    if (!user) return;
    setConfirming(true);
    const { error } = await supabase
      .from("profiles")
      .update({ age_confirmed: true })
      .eq("id", user.id);
    setConfirming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
  }

  async function submitReport() {
    if (!user || !chat.partner) return;
    const partnerId = chat.partner.id;
    const matchId = chat.match?.id ?? null;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: partnerId,
      match_id: matchId,
      reason: reportReason,
      details: reportDetails.slice(0, 500),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: partnerId });
    setReportOpen(false);
    setReportDetails("");
    toast.success("Report sent. You will not be matched with them again.");
    await chat.next();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft;
    setDraft("");
    try {
      await chat.sendMessage(body);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message not sent");
    }
  }

  if (ban) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <Lock className="mx-auto size-10 text-destructive" />
          <h1 className="mt-5 text-2xl font-bold">Your account is suspended</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Reason: {ban.reason || "Breaking the house rules"}.
            {ban.expires_at
              ? ` Access returns on ${new Date(ban.expires_at).toLocaleString()}.`
              : " This suspension is permanent."}
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (profile && !profile.age_confirmed) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-20">
          <div className="rounded-2xl border border-border bg-card p-7">
            <h1 className="text-2xl font-bold">Before you join</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              StaticRoom pairs you with real strangers on camera. You must be 18 or older, keep
              clothes on, and treat people decently. Reports are reviewed and accounts get banned.
            </p>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
              <Checkbox
                checked={false}
                onCheckedChange={() => confirmAge()}
                disabled={confirming}
                className="mt-0.5"
              />
              <span className="text-sm">
                I confirm I am 18 or older and I accept the house rules.
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  const statusText: Record<string, string> = {
    idle: "Ready when you are",
    starting: "Turning on your camera…",
    searching: "Looking for someone…",
    connecting: "Connecting…",
    connected: "Connected",
    "partner-left": "They left the chat",
    error: "Something went wrong",
  };

  const running = chat.status !== "idle" && chat.status !== "error";
  const permissionsGranted = chat.camPermission === "granted" && chat.micPermission === "granted";
  const permissionsDenied = chat.camPermission === "denied" || chat.micPermission === "denied";

  async function allowDevices() {
    try {
      await chat.requestPermissions();
      toast.success("Camera and microphone are on.");
    } catch {
      toast.error("Permission denied. Allow camera and microphone in your browser settings.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-32">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* ---------------- video ---------------- */}
          <section>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="size-full object-cover"
              />
              {chat.status !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 text-center">
                  {(chat.status === "searching" ||
                    chat.status === "connecting" ||
                    chat.status === "starting") && (
                    <Loader2 className="size-7 animate-spin text-primary" />
                  )}
                  <p className="font-display text-lg">{statusText[chat.status]}</p>
                  {chat.status === "idle" && (
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Press start and we will drop you into a call with the next person waiting.
                    </p>
                  )}
                  {chat.status === "partner-left" && (
                    <Button onClick={() => chat.next()}>Find someone new</Button>
                  )}
                </div>
              )}

              <div className="absolute bottom-3 right-3 h-24 w-36 overflow-hidden rounded-lg border border-border bg-black sm:h-32 sm:w-48">
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted
                  className="size-full scale-x-[-1] object-cover"
                />
              </div>

              {chat.status === "connected" && chat.partner && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {chat.partner.display_name} · {genderLabel(chat.partner.gender)} ·{" "}
                  {countryLabel(chat.partner.country)}
                </div>
              )}
            </div>

            {permissionsDenied && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p>
                  Camera or microphone permission is blocked. Chat cannot start until you allow
                  both in your browser's site settings, then reload this page.
                </p>
              </div>
            )}

            {/* ---------------- preferences ---------------- */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Matching
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="interests">
                    Interests {isPremium ? "(comma separated)" : "(1 tag on Free)"}
                  </Label>
                  <Input
                    id="interests"
                    value={interestText}
                    onChange={(e) => setInterestText(e.target.value)}
                    placeholder="music, football, coding"
                    disabled={running}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((i) => (
                      <Badge key={i} variant="secondary">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Gender filter {!isPremium && <Lock className="size-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={wantGender}
                    onValueChange={setWantGender}
                    disabled={!isPremium || running}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Anyone</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Country filter {!isPremium && <Lock className="size-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={wantCountry}
                    onValueChange={setWantCountry}
                    disabled={!isPremium || running}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anywhere" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Anywhere</SelectItem>
                      {COUNTRIES.filter((c) => c.value !== "XX").map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  {!isPremium && (
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/pricing">Unlock filters</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ---------------- text chat ---------------- */}
          <section className="flex h-[520px] flex-col rounded-2xl border border-border bg-card lg:h-auto">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">
                {chat.partner ? `Chat with ${chat.partner.display_name}` : "Chat"}
              </p>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {chat.messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {chat.status === "connected"
                    ? "Say hi 👋"
                    : "Messages appear here once you are matched."}
                </p>
              )}
              {chat.messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.sender_id === user?.id
                      ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm"
                  }
                >
                  {m.body}
                </div>
              ))}
              {chat.partnerTyping && (
                <p className="text-xs italic text-muted-foreground">Stranger is typing…</p>
              )}
            </div>
            <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  chat.sendTyping();
                }}
                placeholder={chat.status === "connected" ? "Type a message" : "Not connected"}
                disabled={chat.status !== "connected"}
                maxLength={500}
              />
              <Button type="submit" size="icon" disabled={chat.status !== "connected" || !draft.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </section>
        </div>
      </main>

      {/* ---------------- bottom control bar ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-3 sm:gap-3">
          {/* mic */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={chat.micOn && permissionsGranted ? "outline" : "destructive"}
              size="icon"
              className="size-11 rounded-full"
              onClick={chat.toggleMic}
              disabled={!permissionsGranted || !chat.localStream}
              aria-label="Toggle microphone"
            >
              {chat.micOn && permissionsGranted ? (
                <Mic className="size-5" />
              ) : (
                <MicOff className="size-5" />
              )}
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {chat.micPermission === "granted" ? (chat.micOn ? "Mic on" : "Mic off") : "Mic blocked"}
            </span>
          </div>

          {/* camera */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={chat.camOn && permissionsGranted ? "outline" : "destructive"}
              size="icon"
              className="size-11 rounded-full"
              onClick={chat.toggleCam}
              disabled={!permissionsGranted || !chat.localStream}
              aria-label="Toggle camera"
            >
              {chat.camOn && permissionsGranted ? (
                <Video className="size-5" />
              ) : (
                <VideoOff className="size-5" />
              )}
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {chat.camPermission === "granted" ? (chat.camOn ? "Cam on" : "Cam off") : "Cam blocked"}
            </span>
          </div>

          {/* start / stop / next */}
          {!permissionsGranted ? (
            <Button size="lg" className="glow-ring" onClick={allowDevices}>
              <Video className="size-4" /> Allow camera & mic
            </Button>
          ) : !running ? (
            <Button
              size="lg"
              className="glow-ring"
              onClick={() =>
                chat.start({
                  interests,
                  wantGender: isPremium && wantGender !== ANY ? wantGender : null,
                  wantCountry: isPremium && wantCountry !== ANY ? wantCountry : null,
                })
              }
            >
              <Play className="size-4" /> Start
            </Button>
          ) : (
            <>
              <Button size="lg" variant="destructive" onClick={() => chat.stop()}>
                <Square className="size-4" /> Stop
              </Button>
              <Button size="lg" onClick={() => chat.next()}>
                <SkipForward className="size-4" /> Next
              </Button>
            </>
          )}

          {/* report */}
          {chat.partner && (
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-full text-destructive"
                onClick={() => setReportOpen(true)}
                aria-label="Report"
              >
                <Flag className="size-5" />
              </Button>
              <span className="text-[10px] text-muted-foreground">Report</span>
            </div>
          )}

          {/* profile */}
          <div className="flex flex-col items-center gap-1">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-11 rounded-full"
            >
              <Link to="/profile" aria-label="Profile">
                <User className="size-5" />
              </Link>
            </Button>
            <span className="text-[10px] text-muted-foreground">Profile</span>
          </div>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this person</DialogTitle>
            <DialogDescription>
              We will end the call, block them from matching with you again, and send this to our
              moderators.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={reportReason} onValueChange={setReportReason} className="gap-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <RadioGroupItem value={r.value} />
                {r.label}
              </label>
            ))}
          </RadioGroup>
          <Textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitReport}>
              Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
