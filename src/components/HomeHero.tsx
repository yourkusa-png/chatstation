import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Video, VideoOff, Mic, MicOff, RefreshCw, Zap, Loader2, Headphones, Users, Radio, ChevronRight,
} from "lucide-react";

type Props = {
  signedIn: boolean;
  busy: boolean;
  onGoogle: () => void;
  mode: "video" | "audio";
  setMode: (m: "video" | "audio") => void;
};

const LOUNGES = [
  { title: "Hindi Late Night Talks", tags: "Chill · Friends · Life", emoji: "🌙" },
  { title: "Music & Chill", tags: "Lo-fi · EDM · Vibes", emoji: "🎧" },
  { title: "Global Strangers Meet", tags: "Talk · Share · Make Friends", emoji: "🌍" },
];

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

  const ctaClass =
    "glow-ring cta-breathe flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent text-base font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60";

  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-4 sm:max-w-xl">
        <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
          {(["video", "audio"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 rounded-full border py-2.5 transition-colors ${mode === m ? "glow-ring border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              {m === "video" ? <><Zap className="size-4" /> 1-on-1 Video</> : <><Mic className="size-4" /> Audio Rooms</>}
            </button>
          ))}
        </div>

        {mode === "video" ? (
          <>
            <div className="glow-ring relative mt-4 aspect-[4/3] overflow-hidden rounded-3xl border-2 border-primary/60 bg-surface">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${camOn ? "" : "hidden"}`}
              />
              {!camOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/20 via-surface to-accent/20 px-6 text-center">
                  <h1 className="text-2xl font-bold">Meet someone new.</h1>
                  <p className="text-sm text-muted-foreground">
                    {camError ? "Camera permission blocked. Allow it in browser settings." : "Check your camera before you match."}
                  </p>
                  <button type="button" onClick={() => start()} className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
                    Turn on camera preview
                  </button>
                </div>
              )}
              <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <span className="size-2 animate-pulse rounded-full bg-destructive" /> LIVE
                </span>
                <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-semibold backdrop-blur-md">HD</span>
              </div>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
                <RoundBtn label={camOn ? "Camera off" : "Camera on"} active={camOn} onClick={toggleCam}>
                  {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                </RoundBtn>
                <RoundBtn label={micOn ? "Mute mic" : "Unmute mic"} active={micOn} onClick={() => setMicOn((v) => !v)}>
                  {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                </RoundBtn>
                <RoundBtn label="Flip camera" active={false} onClick={flip}>
                  <RefreshCw className="size-5" />
                </RoundBtn>
              </div>
            </div>

            <div className="mt-4">
              {signedIn ? (
                <Link to="/chat" onClick={stop} className={ctaClass}>
                  <Zap className="size-5" /> Start Instant Match
                </Link>
              ) : (
                <button type="button" onClick={onGoogle} disabled={busy} className={ctaClass}>
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <Zap className="size-5" />} Start Instant Match
                </button>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {signedIn ? "Free · Skip anytime" : "One tap with Google · Free"} · 18+ only
              </p>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center">
            <Headphones className="mx-auto size-10 text-primary" />
            <h1 className="mt-3 text-2xl font-bold">Talk with your voice.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Voice-only rooms for 5–6 people are coming soon.</p>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Headphones className="size-5 text-primary" /> Popular Audio Lounges
            </h2>
            <span className="rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold text-primary">Coming soon</span>
          </div>
          <div className="mt-3 grid gap-3">
            {LOUNGES.map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-2xl">
                  {r.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate font-semibold">{r.title} <ChevronRight className="size-4 text-muted-foreground" /></p>
                  <p className="truncate text-xs text-primary/80">{r.tags}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> Up to 6 people · Voice only</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Radio className="size-3" /> Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoundBtn({ children, label, active, onClick }: { children: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex size-12 items-center justify-center rounded-full border-2 bg-background/70 backdrop-blur-md ${active ? "border-primary text-primary" : "border-border text-foreground"}`}
    >
      {children}
    </button>
  );
}
