import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type OnlineUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  country: string;
  gender: string;
  is_premium: boolean;
};

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const POLL_MS = 30_000;

// One shared heartbeat + poll per tab; every subscriber reads the same list.
let started = false;
let latest: OnlineUser[] = [];
const listeners = new Set<(users: OnlineUser[]) => void>();

function publish(next: OnlineUser[]) {
  latest = next;
  listeners.forEach((l) => l(latest));
}

function start() {
  if (started) return;
  started = true;

  const tick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) {
      publish([]);
      return;
    }
    // Heartbeat: mark this user as seen right now.
    await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, country, gender, is_premium")
      .gt("last_seen_at", cutoff)
      .order("last_seen_at", { ascending: false })
      .limit(24);
    publish((data ?? []) as OnlineUser[]);
  };

  void tick();
  setInterval(() => void tick(), POLL_MS);
}

export function useOnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>(latest);
  useEffect(() => {
    start();
    listeners.add(setUsers);
    setUsers(latest);
    return () => {
      listeners.delete(setUsers);
    };
  }, []);
  return { users, count: users.length };
}
