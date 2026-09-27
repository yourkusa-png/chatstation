import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type KlipyFile = Record<string, Record<string, { url?: string }> | undefined>;

export const searchGifs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const klipyKey = process.env["KLIPY_API_KEY"];
    if (!lovableKey || !klipyKey) return { gifs: [], error: "GIFs are not configured" };
    const q = data.q.trim();
    const params = new URLSearchParams({ customer_id: context.userId, per_page: "24" });
    if (q) params.set("q", q);
    const res = await fetch(
      `https://connector-gateway.lovable.dev/klipy/gifs/${q ? "search" : "trending"}?${params}`,
      { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": klipyKey } },
    );
    if (!res.ok) {
      console.error("GIF search failed", res.status, await res.text());
      return { gifs: [], error: "Could not load GIFs" };
    }
    const json = (await res.json()) as { result?: boolean; data?: { data?: { id: number; file?: KlipyFile }[] } };
    if (!json.result) return { gifs: [], error: "Could not load GIFs" };
    const gifs = (json.data?.data ?? [])
      .map((item) => {
        const f = item.file ?? {};
        const url =
          f["md"]?.["gif"]?.url ?? f["sm"]?.["gif"]?.url ?? f["xs"]?.["gif"]?.url ?? f["md"]?.["webp"]?.url;
        return url ? { id: String(item.id), url } : null;
      })
      .filter((g): g is { id: string; url: string } => g !== null);
    return { gifs, error: null as string | null };
  });
