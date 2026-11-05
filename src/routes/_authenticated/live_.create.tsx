import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Loader2, Mic, MicOff, Radio, RefreshCw, Video, VideoOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { fileToAvatarBlob } from "@/lib/avatars";
import { RoomThumb } from "@/components/RoomThumb";
import { ROOM_CATEGORIES, ROOM_THUMBNAILS, useRooms } from "@/hooks/useRooms";

export const Route = createFileRoute("/_authenticated/live_/create")({
  head: () => ({
    meta: [
      { title: "Go Live Studio · CHAT STATION" },
      { name: "description", content: "Set up your camera, cover and title, then go live on CHAT STATION." },
      { property: "og:title", content: "Go Live Studio · CHAT STATION" },
      { property: "og:description", content: "Creator studio to start a live room on CHAT STATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveStudio,
});

function LiveStudio() {
  const navigate = useNavigate();
  const { createRoom, creating } = useRooms();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camError, setCamError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chill");
  const [thumbnail, setThumbnail] = useState("🎙️");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 } }, audio: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        streamRef.current = s;
        s.getVideoTracks().forEach((t) => (t.enabled = camOn));
        s.getAudioTracks().forEach((t) => (t.enabled = micOn));
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamError(null);
      })
      .catch(() => setCamError("Camera/mic permission nahi mili"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  function toggleCam() {
    const v = !camOn;
    setCamOn(v);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = v));
  }
  function toggleMic() {
    const v = !micOn;
    setMicOn(v);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = v));
  }

  async function uploadCover(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again");
      const blob = await fileToAvatarBlob(file, 1280);
      const path = `${u.user.id}/room-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      setThumbnail(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function start() {
    setError(null);
    try {
      const id = await createRoom({ title, category, thumbnail });
      if (!id) return;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      navigate({ to: "/room/$id", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not go live");
    }
  }

  return (
    <div className="studio-bg min-h-screen px-4 pb-28 pt-4 text-foreground">
      <div className="flex items-center gap-3">
        <Link to="/live" aria-label="Back"><ArrowLeft className="size-5" /></Link>
        <h1 className="flex items-center gap-2 text-xl font-bold"><Radio className="size-5 text-destructive" /> Live Studio</h1>
      </div>

      <div className="glass-3d relative mt-4 aspect-[3/4] overflow-hidden rounded-3xl sm:aspect-video">
        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${camOn && !camError ? "" : "hidden"}`} />
        {(!camOn || camError) && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{camError ?? "Camera off"}</div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-background/70 px-2 py-0.5 text-[11px] font-bold backdrop-blur">PREVIEW</span>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
          <button onClick={toggleMic} aria-label="Mic" className="btn-3d flex size-12 items-center justify-center rounded-full">{micOn ? <Mic className="size-5" /> : <MicOff className="size-5 text-destructive" />}</button>
          <button onClick={toggleCam} aria-label="Camera" className="btn-3d flex size-12 items-center justify-center rounded-full">{camOn ? <Video className="size-5" /> : <VideoOff className="size-5 text-destructive" />}</button>
          <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} aria-label="Flip camera" className="btn-3d flex size-12 items-center justify-center rounded-full"><RefreshCw className="size-5" /></button>
        </div>
      </div>

      <section className="glass-3d mt-4 space-y-4 rounded-3xl p-4">
        <div>
          <label htmlFor="live-title" className="text-sm font-semibold">Live title</label>
          <input id="live-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="Late Night Talks" className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <p className="text-sm font-semibold">Cover</p>
          <div className="mt-1.5 flex gap-3">
            <RoomThumb thumbnail={thumbnail} className="tilt-3d h-20 w-32 shrink-0 rounded-2xl border border-border" />
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/60 bg-primary/10 text-sm font-semibold text-primary">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Gallery
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); e.target.value = ""; }} />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROOM_THUMBNAILS.map((e) => (
              <button key={e} type="button" onClick={() => setThumbnail(e)} className={`flex size-10 items-center justify-center rounded-xl border text-lg ${thumbnail === e ? "border-primary bg-primary/15" : "border-border bg-card/60"}`}>{e}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Category</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ROOM_CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === c.value ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Paid / private live — Coming soon. Abhi free hai.</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-background/80 p-4 backdrop-blur">
        <button onClick={() => void start()} disabled={creating} className="btn-live-3d flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold disabled:opacity-60">
          {creating ? <Loader2 className="size-5 animate-spin" /> : <Radio className="size-5" />} Start Live Now
        </button>
      </div>
    </div>
  );
}
