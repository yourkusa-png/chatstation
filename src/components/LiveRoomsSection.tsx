import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { ROOM_CATEGORIES, useRooms } from "@/hooks/useRooms";

type Props = {
  signedIn: boolean;
  busy: boolean;
  onGoogle: () => void;
};

export function LiveRoomsSection({ signedIn, busy, onGoogle }: Props) {
  const navigate = useNavigate();
  const { rooms } = useRooms();
  const [createOpen, setCreateOpen] = useState(false);

  function joinRoom(id: string) {
    if (!signedIn) {
      onGoogle();
      return;
    }
    navigate({ to: "/room/$id", params: { id } });
  }

  return (
    <section id="rooms">
      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-lg font-bold">Live Rooms</h2>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => (signedIn ? setCreateOpen(true) : onGoogle())}
          disabled={busy}
        >
          <Plus className="size-4" /> Create room
        </Button>
      </div>

      {rooms === null ? (
        <div className="mt-3 grid gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
          <p className="text-2xl">🎙️</p>
          <p className="mt-1 text-sm font-semibold">No rooms live yet</p>
          <p className="text-xs text-muted-foreground">Be the first host — create a room and go live.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {rooms.map((r) => {
            const full = r.member_count >= r.max_members;
            const category = ROOM_CATEGORIES.find((c) => c.value === r.category);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 text-2xl">
                  {r.thumbnail}
                  <span className="absolute -right-1 -top-1 size-2.5 animate-pulse rounded-full bg-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {category ? `${category.emoji} ${category.label}` : r.category} · {r.member_count}/{r.max_members} inside
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => joinRoom(r.id)}
                  disabled={full}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Users className="size-3" /> {full ? "Full" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />}
      {busy && <Loader2 className="hidden" />}
    </section>
  );
}
