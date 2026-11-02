import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { LiveRoomsSection } from "@/components/LiveRoomsSection";
import {
  Video, VideoOff, Mic, MicOff, RefreshCw, Zap, Loader2, Headphones, Radio, MessageSquare,
} from "lucide-react";

type Props = {
  signedIn: boolean;
  busy: boolean;
  onGoogle: () => void;
  mode: "video" | "audio";
  setMode: (m: "video" | "audio") => void;
};

export function HomeHero({ signedIn, busy, onGoogle, mode, setMode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [camError, setCamError] = useState(false);

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start(face = facing) {
    stop();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face }, audio: false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamOn(true);
      setCamError(false);
    } catch {
      setCamOn(false);
      setCamError(true);
    }
  }

  useEffect(() => () => stop(), []);

  function toggleCam() {
    if (camOn) { stop(); setCamOn(false); } else start();
  }
  function flip() {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    if (camOn) start(next);
  }


  const online = useOnlineCount();
  const Cta = ({ children, className }: { children: React.ReactNode; className: string }) =>
    signedIn ? (
      <Link to="/chat" onClick={stop} className={className}>{children}</Link>
    ) : (
      <button type="button" onClick={onGoogle} disabled={busy} className={className}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}{children}
      </button>
    );
  const pill = "flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold disabled:opacity-60";

  return (
    <section>
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-3 sm:max-w-xl">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1 text-sm font-semibold">
          {(["video", "audio"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { if (m === "audio") stop(); setMode(m); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all ${mode === m ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"}`}>
              {m === "video" ? <><Video className="size-4" /> Video Call</> : <><Mic className="size-4" /> Audio Call</>}
            </button>
          ))}
        </div>

        <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-surface">
          <video ref={videoRef} autoPlay muted playsInline
            className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${camOn && mode === "video" ? "" : "hidden"}`} />
          {!(camOn && mode === "video") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/20 via-surface to-accent/20 px-6 text-center">
              {mode === "video" ? <Video className="size-9 text-primary" /> : <Headphones className="size-9 text-primary" />}
              <h1 className="text-xl font-bold">{mode === "video" ? "Meet someone new." : "Talk with your voice."}</h1>
              {mode === "video" && (
                <button type="button" onClick={() => start()} className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold text-primary">
                  {camError ? "Allow camera in settings" : "Check your camera"}
                </button>
              )}
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive-foreground" /> LIVE
            </span>
            <span className="rounded-md bg-background/70 px-2 py-0.5 text-xs font-semibold backdrop-blur-md">Auto HD</span>
          </div>
          {mode === "video" && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <RoundBtn label={camOn ? "Camera off" : "Camera on"} active={camOn} onClick={toggleCam}>
                {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
              </RoundBtn>
              <RoundBtn label={micOn ? "Mute mic" : "Unmute mic"} active={micOn} onClick={() => setMicOn((v) => !v)}>
                {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
              </RoundBtn>
              <RoundBtn label="Flip camera" active={false} onClick={flip}><RefreshCw className="size-4" /></RoundBtn>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Cta className={`${pill} border-border bg-card`}><MessageSquare className="size-4" /> Start Chat</Cta>
          <Cta className={`${pill} glow-ring border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground`}><Zap className="size-4" /> Instant Match</Cta>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{signedIn ? "Free · Skip anytime" : "One tap with Google · Free"} · 18+ only</p>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Radio className="size-5 text-destructive" /> People Online</h2>
          <span className="text-xs text-muted-foreground">{online} online now</span>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {AVATARS.map((e, k) => (
            <div key={k} className="relative flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-accent/70 bg-gradient-to-br from-primary/30 to-accent/30 text-2xl">
              {e}
              <span className="absolute -bottom-1 rounded bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">LIVE</span>
            </div>
          ))}
        </div>

        <LiveRoomsSection signedIn={signedIn} busy={busy} onGoogle={onGoogle} />
      </div>
    </section>
  );
}

const AVATARS = ["😎", "🎧", "🌸", "🎮", "🌙", "⚡", "🎤"];

function RoundBtn({ children, label, active, onClick }: { children: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-full border bg-background/70 backdrop-blur-md ${active ? "border-primary text-primary" : "border-border text-foreground"}`}
    >
      {children}
    </button>
  );
}
