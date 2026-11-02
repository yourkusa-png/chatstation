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

  const startBtn =
    "flex size-44 flex-col items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-60";

  const startInner = (
    <>
      {busy ? <Loader2 className="size-10 animate-spin" /> : <Video className="size-10" />}
      <span className="text-xl font-bold tracking-wide">START</span>
    </>
  );

  return (
    <section>
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6 sm:max-w-xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            <span className="size-2 rounded-full bg-primary" />
            {online > 0 ? `${online} online now` : "Video chat"}
          </span>
          <h1 className="mt-4 text-2xl font-bold">Meet someone new</h1>
          <p className="mt-1 text-sm text-muted-foreground">1-on-1 video · Free · Skip anytime · 18+</p>

          <div className="mt-8">
            {signedIn ? (
              <Link to="/chat" className={startBtn} aria-label="Start video match">{startInner}</Link>
            ) : (
              <button type="button" onClick={onGoogle} disabled={busy} className={startBtn} aria-label="Start video match">{startInner}</button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {signedIn ? "Tap START to match instantly" : "One tap with Google to start"}
          </p>

          <a href="#rooms" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
            <Mic className="size-4" /> Live Rooms <ChevronRight className="size-4" />
          </a>
        </div>

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
