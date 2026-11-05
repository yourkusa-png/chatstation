import { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/avatars";

/** A room thumbnail is either an emoji or an uploaded photo path ("uid/room-123.jpg"). */
export function isPhotoThumb(t: string | null | undefined) {
  return !!t && (t.includes("/") || t.startsWith("https://"));
}

export function RoomThumb({ thumbnail, className = "" }: { thumbnail: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const photo = isPhotoThumb(thumbnail);
  useEffect(() => {
    let off = false;
    if (photo) void getAvatarUrl(thumbnail).then((u) => !off && setUrl(u));
    return () => {
      off = true;
    };
  }, [thumbnail, photo]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/40 via-accent/25 to-background ${className}`}
    >
      {photo ? (
        url ? <img src={url} alt="Room cover" className="absolute inset-0 size-full object-cover" /> : null
      ) : (
        <span className="text-6xl drop-shadow-lg">{thumbnail}</span>
      )}
    </div>
  );
}
