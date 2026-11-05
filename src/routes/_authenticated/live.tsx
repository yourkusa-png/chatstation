import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Radio, Search, UserRound, Users, Video } from "lucide-react";

import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { RoomThumb } from "@/components/RoomThumb";
import { useRooms } from "@/hooks/useRooms";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live · CHAT STATION" },
      { name: "description", content: "Watch and join live rooms on CHAT STATION, or go live yourself." },
      { property: "og:title", content: "Live · CHAT STATION" },
      { property: "og:description", content: "Watch and join live rooms, or go live yourself." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const navigate = useNavigate();
  const { rooms } = useRooms();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const list = (rooms ?? [])
    .filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase()) || r.id.startsWith(q.trim()))
    .sort((a, b) => b.member_count - a.member_count);

  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-4 text-foreground">
      <div className="flex items-center gap-3">
        <Link to="/" aria-label="Back"><ArrowLeft className="size-5" /></Link>
        <h1 className="flex items-center gap-2 text-xl font-bold"><Radio className="size-5 text-destructive" /> Live</h1>
        <button onClick={() => setOpen(true)} className="ml-auto rounded-full bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">
          Go Live
        </button>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search live by name or ID" className="w-full bg-transparent text-sm outline-none" />
      </label>

      <h2 className="mt-5 text-sm font-semibold text-muted-foreground">Popular live now</h2>
      {rooms === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">{q ? "This live was not found." : "No one is live yet. Be the first!"}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {list.map((r) => (
            <button key={r.id} onClick={() => navigate({ to: "/room/$id", params: { id: r.id } })} className="overflow-hidden rounded-2xl border border-border bg-card text-left">
              <div className="relative">
                <RoomThumb thumbnail={r.thumbnail} className="h-32 w-full" />
                <span className="absolute left-2 top-2 rounded bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">LIVE</span>
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-background/70 px-1.5 text-[10px]"><Users className="size-3" />{r.member_count}</span>
              </div>
              <p className="truncate p-2 text-sm font-semibold">{r.title}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        Subscription / Paid private live — Coming soon. Abhi sab free hai.
      </div>

      {open && <CreateRoomDialog open={open} onOpenChange={setOpen} />}

      <div className="h-16" />
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/90 backdrop-blur">
        <Link to="/" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"><Home className="size-5" /> Home</Link>
        <Link to="/chat" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"><Video className="size-5" /> Video</Link>
        <Link to="/live" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-destructive"><Radio className="size-5" /> Live</Link>
        <Link to="/profile" className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"><UserRound className="size-5" /> Profile</Link>
      </nav>
    </div>
  );
}
