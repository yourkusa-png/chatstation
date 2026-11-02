import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

/**
 * Resolve an avatar reference to a displayable URL.
 * References can be a full https URL or a storage path inside the private
 * "avatars" bucket, optionally with a `?v=` cache-buster (`uid/avatar.jpg?v=3`).
 */
export async function getAvatarUrl(raw: string | null | undefined): Promise<string | null> {
  if (!raw) return null;
  if (raw.startsWith("https://")) return raw;
  if (cache.has(raw)) return cache.get(raw)!;
  const path = raw.split("?")[0];
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!data?.signedUrl) return null;
  cache.set(raw, data.signedUrl);
  return data.signedUrl;
}

export function clearAvatarCache(raw?: string | null) {
  if (raw) cache.delete(raw);
  else cache.clear();
}

/** Downscale an image file on the device so uploads stay small (no server cost). */
export async function fileToAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the photo"))),
      "image/jpeg",
      0.85,
    );
  });
}
