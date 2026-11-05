import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Crown,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
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
import { ROOM_THUMBNAILS } from "@/hooks/useRooms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAvatarUrl } from "@/lib/avatars";
import { RoomThumb } from "@/components/RoomThumb";

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
  full,
}: {
  stream: MediaStream | null;
  name: string;
  isSelf: boolean;
  isHost: boolean;
  camOn: boolean;
  micOn: boolean;
  avatar: string | null;
  action?: React.ReactNode;
  full?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
    if (videoRef.current && stream) void videoRef.current.play().catch(() => {});
  }, [stream]);

  return (
    <div className={full ? "relative size-full bg-surface" : "relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface"}>
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
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (joinedOnce.current) return;
    joinedOnce.current = true;
    void room.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  const hostId = room.room?.host_id;
  const hostStream = room.isHost ? room.localStream : hostId ? room.remoteStreams.get(hostId) ?? null : null;
  const hostMeta = hostId ? room.peerMeta[hostId] : undefined;
  const hostName = room.isHost ? "You" : hostMeta?.name ?? "Host";
  const hostCam = room.isHost ? room.camOn : hostMeta?.cam_on ?? true;
  const others = peers.filter((p) => p !== hostId);
  const recent = room.messages.slice(-6);

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <Tile stream={hostStream} name={hostName} isSelf={room.isHost} isHost camOn={hostCam} micOn={room.isHost ? room.micOn : hostMeta?.mic_on ?? true} avatar={room.isHost ? null : hostMeta?.avatar_url ?? null} full />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background/90 to-transparent" />

      <header className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 pt-3">
        <button type="button" aria-label="Leave room" onClick={handleLeave} className="flex size-9 items-center justify-center rounded-full bg-background/50 backdrop-blur"><ArrowLeft className="size-5" /></button>
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-background/50 py-1 pl-1 pr-3 backdrop-blur">
          {room.isHost ? (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Change thumbnail"><RoomThumb thumbnail={room.room?.thumbnail ?? "🎙️"} className="size-8 rounded-full [&_span]:text-lg" /></button>
              </PopoverTrigger>
              <PopoverContent className="w-56 rounded-2xl p-2">
                <div className="grid grid-cols-5 gap-1">
                  {ROOM_THUMBNAILS.map((e) => (
                    <button key={e} type="button" onClick={() => void room.setThumbnail(e)} className="flex size-9 items-center justify-center rounded-lg text-xl hover:bg-secondary">{e}</button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <RoomThumb thumbnail={room.room?.thumbnail ?? "🎙️"} className="size-8 rounded-full [&_span]:text-lg" />
          )}
          <div className="min-w-0">
            <p className="max-w-[9rem] truncate text-sm font-bold">{room.room?.title ?? "Live"}</p>
            <p className="truncate text-[10px] text-muted-foreground">@{hostName}</p>
          </div>
        </div>
        <span className="ml-auto rounded bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">LIVE</span>
        <span className="flex items-center gap-1 rounded-full bg-background/50 px-2 py-0.5 text-xs backdrop-blur"><Users className="size-3.5" />{count}</span>
      </header>

      {(others.length > 0 || !room.isHost) && (
        <div className="absolute right-3 top-16 flex w-24 flex-col gap-2">
          {!room.isHost && (
            <Tile stream={room.localStream} name="You" isSelf isHost={false} camOn={room.camOn} micOn={room.micOn} avatar={null} />
          )}
          {others.map((peerId) => {
            const meta = room.peerMeta[peerId];
            return (
              <Tile key={peerId} stream={room.remoteStreams.get(peerId) ?? null} name={meta?.name ?? "Guest"} isSelf={false} isHost={false} camOn={meta?.cam_on ?? true} micOn={meta?.mic_on ?? true} avatar={meta?.avatar_url ?? null}
                action={room.isHost ? (
                  <button type="button" aria-label="Toggle mic" onClick={() => room.hostSetMic(peerId, meta?.mic_on ?? true)} className="flex size-6 items-center justify-center rounded-full bg-background/80">
                    {meta?.mic_on ? <Mic className="size-3" /> : <MicOff className="size-3 text-destructive" />}
                  </button>
                ) : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="absolute bottom-20 left-3 right-20 flex flex-col gap-1.5">
        {recent.length === 0 && <p className="w-fit rounded-2xl bg-background/50 px-3 py-1.5 text-xs backdrop-blur">Say hi to the live 👋</p>}
        {recent.map((m) => (
          <p key={m.id} className="w-fit max-w-full rounded-2xl bg-background/50 px-3 py-1.5 text-sm backdrop-blur">
            <span className="mr-1 font-semibold text-primary">{m.sender_id === room.userId ? "You" : room.peerMeta[m.sender_id]?.name ?? "Guest"}</span>
            {m.body}
          </p>
        ))}
      </div>

      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-3">
        <button type="button" aria-label={room.micOn ? "Mute mic" : "Unmute mic"} onClick={room.toggleMic} className="flex size-11 items-center justify-center rounded-full bg-background/50 backdrop-blur">{room.micOn ? <Mic className="size-5" /> : <MicOff className="size-5 text-destructive" />}</button>
        <button type="button" aria-label="Camera" onClick={room.toggleCam} className="flex size-11 items-center justify-center rounded-full bg-background/50 backdrop-blur">{room.camOn ? <Video className="size-5" /> : <VideoOff className="size-5 text-destructive" />}</button>
        <button type="button" aria-label="Flip camera" onClick={() => void room.switchCamera()} className="flex size-11 items-center justify-center rounded-full bg-background/50 backdrop-blur"><RefreshCw className="size-5" /></button>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Gifts" className="flex size-11 items-center justify-center rounded-full bg-background/50 text-xl backdrop-blur">🎁</button>
          </PopoverTrigger>
          <PopoverContent side="left" className="w-auto rounded-2xl p-2">
            <div className="flex gap-1">
              {["🌹", "❤️", "🔥", "🎉", "👑", "💎"].map((g) => (
                <button key={g} aria-label={`Send gift ${g}`} onClick={() => void room.sendMessage(`🎁 Gift ${g}`)} className="rounded-full px-2 py-1 text-xl active:scale-90">{g}</button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <button type="button" aria-label="Send heart" onClick={() => void room.sendMessage("❤️")} className="flex size-11 items-center justify-center rounded-full bg-background/50 text-xl backdrop-blur">❤️</button>
        <button type="button" onClick={room.isHost ? handleEnd : handleLeave} aria-label={room.isHost ? "End live" : "Leave"} className="flex size-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><LogOut className="size-5" /></button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 pb-4">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void handleSend()} placeholder="Say something…" maxLength={300} className="h-11 rounded-full border-border/50 bg-background/50 backdrop-blur" />
        <Button size="icon" aria-label="Send" onClick={() => void handleSend()} className="size-11 shrink-0 rounded-full"><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
