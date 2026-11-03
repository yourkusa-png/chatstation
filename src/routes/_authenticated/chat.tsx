import { useEffect, useMemo, useRef, useState } from "react";
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
  Send,
  Heart,
  SwitchCamera,
  Lock,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
  LogOut,
  Smile,
  Gift,
  UserPlus,
  UserCheck,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { useRandomChat } from "@/hooks/useRandomChat";
import { getAvatarUrl } from "@/lib/avatars";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, GENDERS, REPORT_REASONS, countryLabel, genderLabel } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (search: Record<string, unknown>): { mode?: "audio" | "video" } => {
    const mode = search["mode"] === "audio" ? "audio" : search["mode"] === "video" ? "video" : undefined;
    return mode ? { mode } : {};
  },
  head: () => ({
    meta: [
      { title: "Video chat · CHAT STATION" },
      { name: "description", content: "Your live random video chat room on CHAT STATION." },
      { property: "og:title", content: "Video chat · CHAT STATION" },
      { property: "og:description", content: "Your live random video chat room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const ANY = "__any__";
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤩", "😊", "😉", "🤗", "🤔", "😮", "😢", "❤️", "🔥", "👏", "👍", "👋", "🎉", "🌍", "✨"];
const GIFTS = ["🌹", "❤️", "☕", "🍫", "🍕", "🎉", "👑", "🎁"];

function ChatPage() {
  const { user, profile, refreshProfile } = useAuth();
  const chat = useRandomChat();
  const { mode: routeMode } = Route.useSearch();
  const audioMode = routeMode === "audio";

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const [interestText, setInterestText] = useState("");
  const [wantGender, setWantGender] = useState<string>(ANY);
  const [wantCountry, setWantCountry] = useState<string>(ANY);
  const [draft, setDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [likeBurst, setLikeBurst] = useState(0);
  const [giftBurst, setGiftBurst] = useState<{ gift: string; seq: number } | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

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

  const { data: followingPartner, refetch: refetchFollowing } = useQuery({
    queryKey: ["following-partner", user?.id, chat.partner?.id],
    enabled: !!user && !!chat.partner,
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id)
        .eq("followed_id", chat.partner!.id);
      return (count ?? 0) > 0;
    },
  });

  async function toggleFollow() {
    if (!user || !chat.partner) return;
    if (followingPartner) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("followed_id", chat.partner.id);
      toast("Unfollowed");
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, followed_id: chat.partner.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Following ${chat.partner.display_name}`);
    }
    void refetchFollowing();
  }

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
    if (chat.likesReceived === 0) return;
    setLikeBurst((value) => value + 1);
    const timer = window.setTimeout(() => setLikeBurst(0), 1400);
    return () => window.clearTimeout(timer);
  }, [chat.likesReceived]);

  useEffect(() => {
    if (!chat.giftReceived) return;
    setGiftBurst(chat.giftReceived);
    const timer = window.setTimeout(() => setGiftBurst(null), 1600);
    return () => window.clearTimeout(timer);
  }, [chat.giftReceived]);

  useEffect(() => {
    if (profile?.interests?.length) setInterestText(profile.interests.join(", "));
  }, [profile?.interests]);

  const interests = interestText
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, isPremium ? 12 : 1);
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    return COUNTRIES.filter((country) => country.value !== "XX" && country.label.toLowerCase().includes(query));
  }, [countrySearch]);

  function insertEmoji(emoji: string) {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`.slice(0, 500);
    setDraft(next);
    setEmojiOpen(false);
    window.requestAnimationFrame(() => {
      input?.focus();
      const caret = Math.min(start + emoji.length, next.length);
      input?.setSelectionRange(caret, caret);
    });
  }


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

  function startCurrent() {
    return chat.start({
      interests,
      wantGender: wantGender !== ANY ? wantGender : null,
      wantCountry: wantCountry !== ANY ? wantCountry : null,
      mode: audioMode ? "audio" : "video",
    });
  }

  // Auto-start matching as soon as the user lands here (1-tap flow).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || ban || !profile?.age_confirmed || chat.status !== "idle") return;
    autoStarted.current = true;
    Promise.resolve(startCurrent()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ban, profile?.age_confirmed, chat.status, audioMode]);

  if (ban) {
    return (
      <div className="min-h-screen">
        <SiteHeader onDisableDevices={chat.disableDevices} />
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
        <SiteHeader onDisableDevices={chat.disableDevices} />
        <div className="mx-auto max-w-lg px-4 py-20">
          <div className="rounded-2xl border border-border bg-card p-7">
            <h1 className="text-2xl font-bold">Before you join</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              CHAT STATION pairs you with real strangers on camera. You must be 18 or older, keep
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
  const permissionsGranted =
    chat.micPermission === "granted" &&
    Boolean(chat.localStream) &&
    (audioMode || chat.camPermission === "granted");
  const permissionsDenied = chat.camPermission === "denied" || chat.micPermission === "denied";

  async function allowDevices() {
    try {
      await chat.requestPermissions();
      toast.success("Camera and microphone are on.");
    } catch {
      toast.error("Permission denied. Allow camera and microphone in your browser settings.");
    }
  }

  const connected = chat.status === "connected";
  const overlayBtn =
    "size-11 rounded-full border border-border/50 bg-background/60 text-foreground backdrop-blur hover:bg-background/80";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SiteHeader onDisableDevices={chat.disableDevices} onOpenFilters={() => setFiltersOpen(true)} />
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col sm:py-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface sm:rounded-3xl sm:border sm:border-border">
          {audioMode ? (
            <AudioView
              chat={chat}
              myId={user?.id ?? null}
              connected={connected}
              running={running}
              statusText={statusText[chat.status] ?? "Ready when you are"}
              permissionsGranted={permissionsGranted}
              permissionsDenied={permissionsDenied}
              onAllowDevices={allowDevices}
              onStart={() => void startCurrent()}
            />
          ) : (
          <>
          {/* ---------------- stranger (top) ---------------- */}
          <section className="relative min-h-0 flex-1 overflow-hidden bg-background">
            <video ref={remoteRef} autoPlay playsInline className="size-full object-cover" />

            {!connected && (
              <div className="grain absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
                {(chat.status === "searching" ||
                  chat.status === "connecting" ||
                  chat.status === "starting") && (
                  <Loader2 className="size-7 animate-spin text-primary" />
                )}
                <p className="font-display text-lg">{statusText[chat.status]}</p>
                {chat.status === "idle" && (
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Press Start and we will connect you with the next person waiting.
                  </p>
                )}
                {chat.status === "partner-left" && (
                  <Button onClick={() => chat.next()}>Find someone new</Button>
                )}
                {permissionsDenied && (
                  <p className="flex max-w-xs items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-left text-xs">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    Camera or mic is blocked. Allow both in your browser's site settings, then reload.
                  </p>
                )}
              </div>
            )}

            {connected && chat.partner && (
              <div className="absolute left-3 top-3 flex max-w-[85%] items-center gap-2 rounded-full border border-border/50 bg-background/60 py-1 pl-1 pr-2 text-xs backdrop-blur">
                <PartnerImg raw={chat.partner.avatar_url} name={chat.partner.display_name} />
                <span className="truncate">
                  {chat.partner.display_name} · {countryLabel(chat.partner.country)}
                </span>
                <button
                  type="button"
                  onClick={() => void toggleFollow()}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-colors ${
                    followingPartner ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {followingPartner ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
                  {followingPartner ? "Following" : "Follow"}
                </button>
              </div>
            )}

            <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
              <Button
                size="icon"
                className={overlayBtn}
                onClick={() => {
                  if (!connected) {
                    toast("Start a chat to send a like");
                    return;
                  }
                  chat.sendLike();
                  setLikeBurst((value) => value + 1);
                  window.setTimeout(() => setLikeBurst(0), 1400);
                }}
                aria-label="Send like"
              >
                <Heart className="size-5 fill-current text-destructive" />
              </Button>
            {running && (
              <>

                <Button
                  size="icon"
                  variant="destructive"
                  className="size-11 rounded-full"
                  onClick={() => setReportOpen(true)}
                  disabled={!chat.partner}
                  aria-label="Report"
                >
                  <Flag className="size-5" />
                </Button>
                <Button size="icon" className={overlayBtn} onClick={() => chat.next()} aria-label="Next">
                  <SkipForward className="size-5" />
                </Button>
              </>
            )}
            </div>
            {likeBurst > 0 && (
              <div key={`${chat.likesReceived}-${likeBurst}`} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-live="polite">
                <Heart className="like-pop size-20 fill-destructive text-destructive" />
                <span className="sr-only">Like received</span>
              </div>
            )}
            {giftBurst && (
              <div key={`gift-${giftBurst.seq}`} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-live="polite">
                <span className="like-pop text-7xl drop-shadow-lg">{giftBurst.gift}</span>
                <span className="sr-only">Gift received</span>
              </div>
            )}
          </section>

          {/* ---------------- you (bottom) ---------------- */}
          <section className="relative min-h-0 flex-1 overflow-hidden border-t border-border bg-background">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className={`size-full object-cover ${chat.facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
            {!chat.localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <VideoOff className="size-8 text-muted-foreground" />
              </div>
            )}

            {/* top-left: stable camera controls */}
            <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-border/50 bg-background/45 p-1 backdrop-blur">
              <Button
                size="icon"
                className={chat.micOn && permissionsGranted ? overlayBtn : "size-11 rounded-full"}
                variant={chat.micOn && permissionsGranted ? "default" : "destructive"}
                onClick={chat.toggleMic}
                disabled={!permissionsGranted}
                aria-label="Toggle microphone"
              >
                {chat.micOn && permissionsGranted ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              </Button>
              <Button
                size="icon"
                className={chat.camOn && permissionsGranted ? overlayBtn : "size-11 rounded-full"}
                variant={chat.camOn && permissionsGranted ? "default" : "destructive"}
                onClick={chat.toggleCam}
                disabled={!permissionsGranted}
                aria-label="Toggle camera"
              >
                {chat.camOn && permissionsGranted ? <Video className="size-5" /> : <VideoOff className="size-5" />}
              </Button>
              <Button
                size="icon"
                className={overlayBtn}
                onClick={() => void chat.switchCamera()}
                disabled={chat.isSwitchingCamera}
                aria-label="Switch front or rear camera"
              >
                <SwitchCamera className={`size-5 ${chat.isSwitchingCamera ? "animate-spin" : ""}`} />
              </Button>
            </div>


            {/* top-right: start / exit */}
            <div className="absolute right-3 top-3">
              {!permissionsGranted ? (
                <Button className="h-11 rounded-full px-5" onClick={allowDevices}>
                  <Video className="size-4" /> Allow camera
                </Button>
              ) : !running ? (
                <Button
                  className="glow-ring h-11 rounded-full px-5"
                  onClick={() => void startCurrent()}
                >
                  <Play className="size-4" /> Start
                </Button>
              ) : (
                <Button variant="destructive" className="h-11 rounded-full px-5" onClick={() => chat.stop()}>
                  <LogOut className="size-4" /> Exit
                </Button>
              )}
            </div>

            {/* messages overlay */}
            <div
              ref={scrollRef}
              className="absolute inset-x-3 bottom-20 flex max-h-[45%] flex-col items-end gap-1.5 overflow-y-auto"
            >
              {chat.messages.slice(-30).map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className="flex max-w-[85%] flex-col items-end">
                    <span className="text-[10px] text-foreground/80 drop-shadow">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                      <span className="font-semibold">{mine ? "You" : chat.partner?.display_name ?? "Stranger"}</span>
                    </span>
                    {m.message_type === "gif" && m.media_url ? (
                      <img
                        src={m.media_url}
                        alt="Shared GIF"
                        loading="lazy"
                        className="max-h-20 w-auto max-w-[8rem] rounded-xl border border-border/40 object-contain shadow-md"
                      />
                    ) : (
                      <span
                        className={
                          mine
                            ? "rounded-2xl bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                            : "rounded-2xl bg-background/70 px-3 py-1.5 text-sm backdrop-blur"
                        }
                      >
                        {m.body}
                      </span>
                    )}
                  </div>
                );
              })}
              {chat.partnerTyping && (
                <span className="rounded-full bg-background/70 px-3 py-1 text-xs italic backdrop-blur">
                  typing…
                </span>
              )}
            </div>

            {/* input bar */}
            <form onSubmit={handleSend} className="absolute inset-x-3 bottom-3 flex items-center gap-1.5">
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" size="icon" variant="outline" className="size-12 shrink-0 rounded-full bg-background/70 backdrop-blur" disabled={!connected} aria-label="Add emoji">
                    <Smile className="size-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64 p-2">
                  <div className="grid grid-cols-5 gap-1" aria-label="Emoji picker">
                    {EMOJIS.map((emoji) => (
                      <Button key={emoji} type="button" variant="ghost" size="icon" className="text-xl" onClick={() => insertEmoji(emoji)}>
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover open={giftOpen} onOpenChange={setGiftOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" size="icon" variant="outline" className="size-12 shrink-0 rounded-full bg-background/70 backdrop-blur" disabled={!connected} aria-label="Send a gift">
                    <Gift className="size-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64 p-3">
                  <p className="mb-2 text-center text-xs text-muted-foreground">Send a small gift</p>
                  <div className="grid grid-cols-4 gap-1" aria-label="Gift picker">
                    {GIFTS.map((gift) => (
                      <Button
                        key={gift}
                        type="button"
                        variant="ghost"
                        className="text-2xl"
                        onClick={() => {
                          chat.sendGift(gift);
                          setGiftOpen(false);
                        }}
                        aria-label={`Send gift ${gift}`}
                      >
                        {gift}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                ref={messageInputRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  chat.sendTyping();
                }}
                placeholder={connected ? "Say something…" : "Chat opens when connected"}
                disabled={!connected}
                maxLength={500}
                className="h-12 min-w-0 flex-1 rounded-full border-border/50 bg-background/60 px-4 backdrop-blur"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 rounded-full"
                disabled={!connected || !draft.trim()}
                aria-label="Send"
              >
                <Send className="size-5" />
              </Button>
            </form>
          </section>
          </>
          )}
        </div>
      </main>

      {/* ---------------- match filters ---------------- */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who do you want to meet?</DialogTitle>
            <DialogDescription>Choose your preferences before finding the next person.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests">
                Interests {isPremium ? "(comma separated)" : "(1 tag on Free)"}
              </Label>
              <Input
                id="interests"
                value={interestText}
                onChange={(e) => setInterestText(e.target.value)}
                placeholder="music, football, coding"
              />
              <div className="flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <Badge key={i} variant="secondary">{i}</Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Gender
                </Label>
                <Select value={wantGender} onValueChange={setWantGender}>
                  <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Anyone</SelectItem>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Country
                </Label>
                <Input value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Search countries" />
                <div className="max-h-44 overflow-y-auto rounded-md border border-border p-1">
                  <button
                    type="button"
                    className={`flex w-full items-center rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${wantCountry === ANY ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setWantCountry(ANY)}
                  >
                    Anywhere
                  </button>
                  {filteredCountries.map((country) => (
                    <button
                      key={country.value}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${wantCountry === country.value ? "bg-primary text-primary-foreground" : ""}`}
                      onClick={() => setWantCountry(country.value)}
                    >
                      <span>{country.label}</span><span className="text-xs opacity-70">{country.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Gender: {wantGender === ANY ? "Anyone" : genderLabel(wantGender)}</span>
              <span aria-hidden="true">·</span>
              <span>Country: {wantCountry === ANY ? "Anywhere" : countryLabel(wantCountry)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setFiltersOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


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

function PartnerImg({ raw, name }: { raw: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getAvatarUrl(raw).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [raw]);
  if (url) return <img src={url} alt="" className="size-8 shrink-0 rounded-full object-cover" />;
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function AudioPartnerPhoto({ raw, name }: { raw: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getAvatarUrl(raw).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [raw]);
  if (url) return <img src={url} alt="" className="relative size-36 rounded-full border border-border object-cover" />;
  return (
    <span className="relative flex size-36 items-center justify-center rounded-full bg-primary/15 text-5xl font-bold text-primary">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function AudioView({
  chat,
  myId,
  connected,
  running,
  statusText,
  permissionsGranted,
  permissionsDenied,
  onAllowDevices,
  onStart,
}: {
  chat: ReturnType<typeof useRandomChat>;
  myId: string | null;
  connected: boolean;
  running: boolean;
  statusText: string;
  permissionsGranted: boolean;
  permissionsDenied: boolean;
  onAllowDevices: () => void;
  onStart: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.partnerTyping]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft;
    setDraft("");
    try {
      await chat.sendMessage(body);
    } catch {
      /* hook surfaces the failure through chat.error */
    }
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden bg-background px-6 py-6">
      <div className="relative mt-4 flex items-center justify-center">
        <span className={`absolute size-40 animate-pulse rounded-full bg-primary/25 ${connected ? "" : "opacity-40"}`} />
        {chat.partner?.avatar_url ? (
          <AudioPartnerPhoto raw={chat.partner.avatar_url} name={chat.partner.display_name} />
        ) : (
          <span className="relative flex size-36 items-center justify-center rounded-full bg-primary/15 text-5xl font-bold text-primary">
            {(chat.partner?.display_name ?? "S").charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-6 text-xl font-bold">{chat.partner?.display_name ?? "Stranger"}</p>
      {chat.partner && <p className="text-sm text-muted-foreground">{countryLabel(chat.partner.country)}</p>}
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        {!connected && running && <Loader2 className="size-4 animate-spin" />}
        {statusText}
      </p>

      {chat.status === "partner-left" && (
        <Button className="mt-4" onClick={() => chat.next()}>
          Find someone new
        </Button>
      )}

      {permissionsDenied && (
        <p className="mt-4 flex max-w-xs items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-left text-xs">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          Microphone is blocked. Allow it in your browser's site settings, then reload.
        </p>
      )}

      {!running && permissionsGranted && (
        <Button className="mt-4" onClick={onStart}>
          <Mic className="size-4" /> Start audio call
        </Button>
      )}
      {!permissionsGranted && !running && (
        <Button className="mt-4" onClick={onAllowDevices}>
          <Mic className="size-4" /> Allow microphone
        </Button>
      )}

      <div
        ref={scrollRef}
        className="mt-5 flex max-h-36 w-full max-w-sm flex-col items-end gap-1.5 overflow-y-auto"
      >
        {chat.messages.slice(-20).map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className="flex max-w-[85%] flex-col items-end">
              {m.message_type === "gif" && m.media_url ? (
                <img
                  src={m.media_url}
                  alt="Shared GIF"
                  loading="lazy"
                  className="max-h-16 w-auto max-w-[7rem] rounded-xl border border-border/40 object-contain"
                />
              ) : (
                <span
                  className={
                    mine
                      ? "rounded-2xl bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                      : "rounded-2xl bg-card px-3 py-1.5 text-sm"
                  }
                >
                  {m.body}
                </span>
              )}
            </div>
          );
        })}
        {chat.partnerTyping && (
          <span className="rounded-full bg-card px-3 py-1 text-xs italic text-muted-foreground">typing…</span>
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex w-full max-w-sm items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            chat.sendTyping();
          }}
          placeholder={connected ? "Say something…" : "Chat opens when connected"}
          disabled={!connected}
          maxLength={500}
          className="h-11 min-w-0 flex-1 rounded-full"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={!connected || !draft.trim()}
          aria-label="Send"
        >
          <Send className="size-4" />
        </Button>
      </form>

      <div className="mt-auto flex items-center gap-4 pb-2 pt-4">
        <button
          type="button"
          onClick={chat.toggleMic}
          aria-label={chat.micOn ? "Mute microphone" : "Unmute microphone"}
          className={`flex size-14 items-center justify-center rounded-full border ${
            chat.micOn ? "border-border bg-card" : "border-destructive/60 bg-destructive/20 text-destructive"
          }`}
        >
          {chat.micOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
        </button>
        {running && (
          <>
            <button
              type="button"
              onClick={() => chat.next()}
              aria-label="Next person"
              className="flex size-14 items-center justify-center rounded-full border border-border bg-card"
            >
              <SkipForward className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => void chat.stop()}
              aria-label="End call"
              className="flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <LogOut className="size-6" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
