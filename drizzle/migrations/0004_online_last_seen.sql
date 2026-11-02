ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles (last_seen_at DESC);

CREATE POLICY "profiles online visible to authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (last_seen_at > now() - interval '120 seconds');