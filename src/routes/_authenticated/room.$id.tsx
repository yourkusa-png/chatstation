import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Crown,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoom } from "@/hooks/useRoom";
import { getAvatarUrl } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/room/$id")({
  head: () => ({
    meta: [
      { title: "Live room · CHAT STATION" },
      { name: "description", content: "Join a live group video room with room chat on CHAT STATION." },
      { property: "og:title", content: "Live room · CHAT STATION" },
      { property: "og:description", content: "Join a live group video room with room chat on CHAT STATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoomPage,
});

function AvatarImg({ raw, name }: { raw: string | null; name: string }) {
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
  if (url) return <img src={url} alt="" className="size-6 rounded-full object-cover" />;
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function Tile({
  stream,
  name,
  isSelf,
  isHost,
  camOn,
  micOn,
  avatar,
  action,
}: {
  stream: MediaStream | null;
  name: string;
  isSelf: boolean;
  isHost: boolean;
  camOn: boolean;
  micOn: boolean;
  avatar: string | null;
  action?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface sm:aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className={`absolute inset-0 size-full object-cover ${isSelf ? "-scale-x-100" : ""} ${stream && camOn ? "" : "hidden"}`}
      />
      {(!stream || !camOn) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-surface to-accent/15">
          {avatar ? (
            <img src={avatar} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
              {name.trim().charAt(0).toUpperCase() || "?"}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{camOn ? "Connecting…" : "Camera off"}</span>
        </div>
      )}
      {action && <div className="absolute right-2 top-2">{action}</div>}
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur">
          <AvatarImg raw={avatar} name={name} />
          <span className="truncate">{name}{isSelf ? " (you)" : ""}</span>
          {isHost && <Crown className="size-3.5 shrink-0 text-yellow-400" />}
        </span>
        {!micOn && <MicOff className="ml-auto size-4 shrink-0 text-destructive" />}
      </div>
    </div>
  );
}

function RoomPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const room = useRoom(id);
  const joinedOnce = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (joinedOnce.current) return;
    joinedOnce.current = true;
    void room.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatOpen, room.messages.length]);

  async function handleLeave() {
    await room.leave();
    navigate({ to: "/chat" });
  }

  async function handleEnd() {
    await room.endRoom();
    toast.success("Room ended for everyone.");
    navigate({ to: "/chat" });
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await room.sendMessage(body);
  }

  if (room.status === "loading" || room.status === "joining") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Joining the room…</p>
      </div>
    );
  }

  if (room.status === "full" || room.status === "ended" || room.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">{room.status === "full" ? "🚪" : "👋"}</span>
        <h1 className="text-xl font-bold">
          {room.status === "full" ? "This room is full" : room.status === "ended" ? "The host ended this room" : "Could not join"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {room.status === "error" ? room.error : "Try another live room or start an instant 1-on-1 match."}
        </p>
        <Button onClick={() => navigate({ to: "/chat" })}>Back to chat</Button>
      </div>
    );
  }

  const peers = [...room.remoteStreams.keys()];
  const count = peers.length + 1;
  const myMeta = { name: "You", avatar: null as string | null };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/70 bg-background/85 px-3 backdrop-blur">
        <Button variant="ghost" size="icon" aria-label="Leave room" onClick={handleLeave}>
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-xl">{room.room?.thumbnail ?? "🎙️"}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{room.room?.title ?? "Live room"}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-destructive" /> LIVE · {count}/{room.room?.max_members ?? 6}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setChatOpen((v) => !v)}>
          <MessageSquare className="size-4" /> Chat
        </Button>
      </header>

      <main className="flex-1 p-2">
        <div className={`grid gap-2 ${count > 1 ? "grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
          <Tile
            stream={room.localStream}
            name={myMeta.name}
            isSelf
            isHost={room.isHost}
            camOn={room.camOn}
            micOn={room.micOn}
            avatar={null}
          />
          {peers.map((peerId) => {
            const meta = room.peerMeta[peerId];
            return (
              <Tile
                key={peerId}
                stream={room.remoteStreams.get(peerId) ?? null}
                name={meta?.name ?? "Stranger"}
                isSelf={false}
                isHost={room.room?.host_id === peerId}
                camOn={meta?.cam_on ?? true}
                micOn={meta?.mic_on ?? true}
                avatar={meta?.avatar_url ?? null}
                action={
                  room.isHost ? (
                    <button
                      type="button"
                      aria-label={meta?.mic_on ? "Mute their mic" : "Give them the mic"}
                      onClick={() => room.hostSetMic(peerId, meta?.mic_on ?? true)}
                      className={`flex size-8 items-center justify-center rounded-full border bg-background/80 backdrop-blur ${
                        meta?.mic_on ? "border-border text-foreground" : "border-primary text-primary"
                      }`}
                    >
                      {meta?.mic_on ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
                    </button>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        {count === 1 && (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Users className="size-4" /> Waiting for people to join — share the room with friends!
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border/70 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <button
            type="button"
            aria-label={room.micOn ? "Mute mic" : "Unmute mic"}
            onClick={room.toggleMic}
            className={`flex size-12 items-center justify-center rounded-full border ${room.micOn ? "border-border bg-card" : "border-destructive/60 bg-destructive/20 text-destructive"}`}
          >
            {room.micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>
          <button
            type="button"
            aria-label={room.camOn ? "Camera off" : "Camera on"}
            onClick={room.toggleCam}
            className={`flex size-12 items-center justify-center rounded-full border ${room.camOn ? "border-border bg-card" : "border-destructive/60 bg-destructive/20 text-destructive"}`}
          >
            {room.camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
          </button>
          {room.isHost ? (
            <button
              type="button"
              onClick={handleEnd}
              className="flex h-12 items-center gap-2 rounded-full bg-destructive px-6 text-sm font-bold text-destructive-foreground"
            >
              <LogOut className="size-5" /> End room
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLeave}
              className="flex h-12 items-center gap-2 rounded-full bg-destructive px-6 text-sm font-bold text-destructive-foreground"
            >
              <LogOut className="size-5" /> Leave
            </button>
          )}
        </div>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-background/60 backdrop-blur-sm">
          <button type="button" aria-label="Close chat" className="flex-1" onClick={() => setChatOpen(false)} />
          <div className="flex h-[65vh] flex-col rounded-t-3xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-bold">Room chat</p>
              <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setChatOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {room.messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Say hi to the room 👋</p>
              )}
              {room.messages.map((m) => {
                const mine = m.sender_id === room.userId;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <span className="rounded-2xl bg-background/80 px-3 py-2 text-sm">
                      {!mine && (
                        <span className="mb-0.5 block text-[10px] font-semibold text-primary">
                          {room.peerMeta[m.sender_id]?.name ?? "Stranger"}
                        </span>
                      )}
                      {m.body}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSend()}
                placeholder="Message the room…"
                maxLength={300}
              />
              <Button size="icon" aria-label="Send" onClick={() => void handleSend()}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
