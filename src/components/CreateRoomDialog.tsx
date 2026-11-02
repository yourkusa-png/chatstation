import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROOM_CATEGORIES, ROOM_THUMBNAILS, useRooms } from "@/hooks/useRooms";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { createRoom, creating } = useRooms();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chill");
  const [thumbnail, setThumbnail] = useState("🎙️");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    try {
      const id = await createRoom({ title, category, thumbnail });
      if (!id) return;
      onOpenChange(false);
      navigate({ to: "/room/$id", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the room");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create a live room</DialogTitle>
          <DialogDescription>People can join your room and see it on the home page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-title">Room name</Label>
            <Input
              id="room-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Late Night Talks"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="flex flex-wrap gap-2">
              {ROOM_THUMBNAILS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setThumbnail(e)}
                  className={`flex size-11 items-center justify-center rounded-xl border text-xl transition-colors ${thumbnail === e ? "border-primary bg-primary/15" : "border-border bg-card"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {ROOM_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${category === c.value ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : null}
            Go live
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
