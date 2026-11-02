import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RoomRow = {
  id: string;
  host_id: string;
  title: string;
  category: string;
  thumbnail: string;
  is_live: boolean;
  max_members: number;
  created_at: string;
  ended_at: string | null;
};

export type RoomWithCount = RoomRow & { member_count: number };

export const ROOM_CATEGORIES = [
  { value: "chill", label: "Chill", emoji: "🛋️" },
  { value: "music", label: "Music", emoji: "🎧" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "late-night", label: "Late Night", emoji: "🌙" },
  { value: "desi", label: "Desi Talks", emoji: "🇮🇳" },
  { value: "english", label: "English", emoji: "🌍" },
];

export const ROOM_THUMBNAILS = ["🎙️", "🎧", "🎮", "🌙", "☕", "🎤", "🔥", "🌍", "💜", "⚡"];

export function useRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithCount[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_live", true)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = (roomData ?? []) as RoomRow[];
    if (list.length === 0) {
      setRooms([]);
      return;
    }
    const ids = list.map((r) => r.id);
    const { data: memberData } = await supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", ids)
      .is("left_at", null);
    const counts = new Map<string, number>();
    for (const m of (memberData ?? []) as { room_id: string }[]) {
      counts.set(m.room_id, (counts.get(m.room_id) ?? 0) + 1);
    }
    setRooms(list.map((r) => ({ ...r, member_count: counts.get(r.id) ?? 0 })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live refresh: new rooms, host ending a room, members joining/leaving.
  useEffect(() => {
    const channel = supabase
      .channel(`rooms-list-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => void load())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const createRoom = useCallback(
    async (input: { title: string; category: string; thumbnail: string }) => {
      if (!user) return null;
      setCreating(true);
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          host_id: user.id,
          title: input.title.trim().slice(0, 40) || "Live room",
          category: input.category,
          thumbnail: input.thumbnail,
        })
        .select("id")
        .single();
      setCreating(false);
      if (error) {
        throw new Error(error.message);
      }
      return (data as { id: string }).id;
    },
    [user],
  );

  return { rooms, creating, createRoom, reload: load };
}
