import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useOnlineUsers, type OnlineUser } from "@/hooks/useOnlineUsers";
import { LiveRoomsSection } from "@/components/LiveRoomsSection";
import { getAvatarUrl } from "@/lib/avatars";
import { Video, Mic, Loader2, ChevronRight } from "lucide-react";

type Props = {
  signedIn: boolean;
  busy: boolean;
  onGoogle: () => void;
  mode?: "video" | "audio";
  setMode?: (m: "video" | "audio") => void;
};

export function HomeHero({ signedIn, busy, onGoogle }: Props) {
  const { users: onlineUsers, count: online } = useOnlineUsers();

  const card =
    "flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60";

  const videoInner = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Video className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">Instant Video Match</span>
        <span className="block text-xs text-muted-foreground">1-on-1 video with a random person</span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </>
  );

  return (
    <section>
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 sm:max-w-xl">
        <h1 className="text-2xl font-bold">Talk to someone new</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {online > 0 ? `${online} online now · ` : ""}Free · Skip anytime · 18+
        </p>

        <div className="mt-5 grid gap-3">
          {signedIn ? (
            <Link to="/chat" className={card}>{videoInner}</Link>
          ) : (
            <button type="button" onClick={onGoogle} disabled={busy} className={card}>{videoInner}</button>
          )}
          <a href="#rooms" className={card}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Mic className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">Voice Rooms</span>
              <span className="block text-xs text-muted-foreground">Join a live room and talk with your voice</span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </a>
        </div>
        {!signedIn && (
          <p className="mt-2 text-center text-xs text-muted-foreground">One tap with Google to start</p>
        )}

        {signedIn && onlineUsers.length > 0 && (
          <>
            <h2 className="mt-8 text-base font-semibold">Online now</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {onlineUsers.map((u) => (
                <OnlineAvatar key={u.id} user={u} />
              ))}
            </div>
          </>
        )}

        <div id="rooms" className="scroll-mt-20">
          <LiveRoomsSection signedIn={signedIn} busy={busy} onGoogle={onGoogle} />
        </div>
      </div>
    </section>
  );
}

function OnlineAvatar({ user }: { user: OnlineUser }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getAvatarUrl(user.avatar_url).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [user.avatar_url]);
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-1">
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-base font-semibold">{user.display_name.charAt(0).toUpperCase() || "?"}</span>
        )}
      </div>
      <span className="w-full truncate text-center text-[10px] text-muted-foreground">{user.display_name}</span>
    </div>
  );
}
