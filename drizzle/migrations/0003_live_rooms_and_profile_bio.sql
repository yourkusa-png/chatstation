-- Rooms: live group video rooms with a host
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Live room'::text,
  category text NOT NULL DEFAULT 'chill'::text,
  thumbnail text NOT NULL DEFAULT '🎙️'::text,
  is_live boolean NOT NULL DEFAULT true,
  max_members int NOT NULL DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT rooms_host_fk FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms read authenticated" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms insert own" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "rooms host updates" ON public.rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "rooms host deletes" ON public.rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Room members (who is in which room right now)
CREATE TABLE public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  CONSTRAINT room_members_unique UNIQUE (room_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read authenticated" ON public.room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members join own" ON public.room_members FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.is_live)
);
CREATE POLICY "members leave own" ON public.room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members remove own rows" ON public.room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Persistent room chat
CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room chat read authenticated" ON public.room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "room chat insert own" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.is_live)
);

-- Realtime for the live rooms list and chat feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- Profile: bio
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT ''::text;

-- Avatar storage policies (private bucket "avatars", one folder per user; shown via signed URLs)
CREATE POLICY "avatars authenticated read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);