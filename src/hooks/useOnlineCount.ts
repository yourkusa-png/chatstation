import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// One shared presence channel per tab; every subscriber reads the same count.
let count = 0;
const listeners = new Set<(n: number) => void>();
let started = false;

function start() {
  if (started) return;
  started = true;
  const key = crypto.randomUUID();
  const channel = supabase.channel("online-users", { config: { presence: { key } } });
  channel
    .on("presence", { event: "sync" }, () => {
      count = Object.keys(channel.presenceState()).length;
      listeners.forEach((l) => l(count));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") channel.track({ at: Date.now() });
    });
}

export function useOnlineCount() {
  const [n, setN] = useState(count);
  useEffect(() => {
    start();
    listeners.add(setN);
    setN(count);
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}
