import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useOnlineUsers, type OnlineUser } from "@/hooks/useOnlineUsers";
import { LiveRoomsSection } from "@/components/LiveRoomsSection";
import { getAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/hooks/useAuth";
import { Video, Mic, Loader2, ChevronRight, UserRound } from "lucide-react";

type Props = {
  signedIn: boolean;
  busy: boolean;
  onGoogle: () => void;
  mode?: "video" | "audio";
  setMode?: (m: "video" | "audio") => void;
};

export function HomeHero({ signedIn, busy, onGoogle }: Props) {
  const { users: onlineUsers, count: online } = useOnlineUsers();
  const { profile } = useAuth();
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [myAvatar, setMyAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAvatarUrl(profile?.avatar_url ?? null).then((u) => {
      if (!cancelled) setMyAvatar(u);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_url]);

  const bigCta =
    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow transition-transform active:scale-[0.98] disabled:opacity-60";

  return (
    <section>
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-4 sm:max-w-xl">
        {/* top row: real online count + own profile / free sign-up */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
            <span className="size-2 rounded-full bg-primary" />
            {online > 0 ? `${online} online now` : "Online now"}
          </span>
          {signedIn ? (
            <Link
              to="/profile"
              className="flex min-w-0 items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:bg-secondary"
            >
              {myAvatar ? (
                <img src={myAvatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(profile?.display_name ?? "Y").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-24 truncate text-xs font-semibold">
                {profile?.display_name ?? "You"}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
              Sign up free
            </button>
          )}
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold">Meet someone new</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          1-on-1 · Free · Skip anytime · 18+
        </p>

        {/* choose the mode: one-to-one video or one-to-one audio */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {(["video", "audio"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-colors ${
                mode === m
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {m === "video" ? <Video className="size-5" /> : <Mic className="size-5" />}
              {m === "video" ? "1-to-1 Video" : "1-to-1 Audio"}
            </button>
          ))}
        </div>

        {/* the big start button, labelled by the chosen mode */}
        <div className="mt-3">
          {signedIn ? (
            <Link
              to="/chat"
              search={{ mode }}
              className={bigCta}
            >
              {mode === "video" ? <Video className="size-5" /> : <Mic className="size-5" />}
              {mode === "video" ? "Start Video Chat" : "Start Audio Chat"}
            </Link>
          ) : (
            <button type="button" onClick={onGoogle} disabled={busy} className={bigCta}>
              {busy ? (
                <Loader2 className="size-5 animate-spin" />
              ) : mode === "video" ? (
                <Video className="size-5" />
              ) : (
                <Mic className="size-5" />
              )}
              {mode === "video" ? "Start Video Chat" : "Start Audio Chat"}
            </button>
          )}
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
