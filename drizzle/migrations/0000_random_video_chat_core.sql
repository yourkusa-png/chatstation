-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.report_status AS ENUM ('open', 'dismissed', 'actioned');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Stranger',
  avatar_url TEXT,
  gender TEXT NOT NULL DEFAULT 'unspecified',
  country TEXT NOT NULL DEFAULT 'XX',
  interests TEXT[] NOT NULL DEFAULT '{}',
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ============ BANS ============
CREATE TABLE public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
CREATE INDEX bans_user_idx ON public.bans (user_id);
GRANT SELECT ON public.bans TO authenticated;
GRANT ALL ON public.bans TO service_role;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans read own or staff" ON public.bans FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "bans staff insert" ON public.bans FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "bans staff delete" ON public.bans FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_banned(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bans
    WHERE user_id = _user_id AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- ============ BLOCKS ============
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks own" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "blocks insert own" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks delete own" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- ============ MATCHES ============
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ended_by UUID
);
CREATE INDEX matches_user_a_idx ON public.matches (user_a) WHERE ended_at IS NULL;
CREATE INDEX matches_user_b_idx ON public.matches (user_b) WHERE ended_at IS NULL;
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches read own" ON public.matches FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_match_member(_match_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.matches WHERE id = _match_id AND (user_a = _user_id OR user_b = _user_id))
$$;

-- ============ QUEUE ============
CREATE TABLE public.waiting_queue (
  user_id UUID PRIMARY KEY,
  interests TEXT[] NOT NULL DEFAULT '{}',
  want_gender TEXT,
  want_country TEXT,
  gender TEXT NOT NULL DEFAULT 'unspecified',
  country TEXT NOT NULL DEFAULT 'XX',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.waiting_queue TO authenticated;
GRANT ALL ON public.waiting_queue TO service_role;
ALTER TABLE public.waiting_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue own" ON public.waiting_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "queue delete own" ON public.waiting_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_match_idx ON public.messages (match_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read member" ON public.messages FOR SELECT TO authenticated
  USING (public.is_match_member(match_id, auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "messages insert member" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_match_member(match_id, auth.uid()));

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  match_id UUID,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status public.report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_status_idx ON public.reports (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports read own or staff" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_staff(auth.uid()));
CREATE POLICY "reports insert own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_id);
CREATE POLICY "reports staff update" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions read own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), split_part(COALESCE(NEW.email, 'Stranger'), '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ MATCHMAKING ============
CREATE OR REPLACE FUNCTION public.join_queue(
  p_interests TEXT[],
  p_want_gender TEXT,
  p_want_country TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  my_profile public.profiles%ROWTYPE;
  partner RECORD;
  new_match UUID;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_banned(me) THEN RAISE EXCEPTION 'You are banned from chatting'; END IF;

  SELECT * INTO my_profile FROM public.profiles WHERE id = me;
  IF my_profile.age_confirmed IS NOT TRUE THEN RAISE EXCEPTION 'Age confirmation required'; END IF;

  -- already in an open match? return it
  SELECT id INTO new_match FROM public.matches
   WHERE ended_at IS NULL AND (user_a = me OR user_b = me) LIMIT 1;
  IF new_match IS NOT NULL THEN RETURN new_match; END IF;

  PERFORM pg_advisory_xact_lock(918273645);

  SELECT q.* INTO partner
  FROM public.waiting_queue q
  JOIN public.profiles p ON p.id = q.user_id
  WHERE q.user_id <> me
    AND NOT public.is_banned(q.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = me AND b.blocked_id = q.user_id) OR (b.blocker_id = q.user_id AND b.blocked_id = me))
    AND (p_want_gender IS NULL OR my_profile.is_premium IS NOT TRUE OR q.gender = p_want_gender)
    AND (p_want_country IS NULL OR my_profile.is_premium IS NOT TRUE OR q.country = p_want_country)
    AND (q.want_gender IS NULL OR q.is_premium IS NOT TRUE OR my_profile.gender = q.want_gender)
    AND (q.want_country IS NULL OR q.is_premium IS NOT TRUE OR my_profile.country = q.want_country)
  ORDER BY
    CASE WHEN q.interests && p_interests THEN 0 ELSE 1 END,
    CASE WHEN q.is_premium THEN 0 ELSE 1 END,
    q.joined_at
  LIMIT 1
  FOR UPDATE OF q SKIP LOCKED;

  IF partner.user_id IS NOT NULL THEN
    DELETE FROM public.waiting_queue WHERE user_id IN (partner.user_id, me);
    INSERT INTO public.matches (user_a, user_b) VALUES (partner.user_id, me) RETURNING id INTO new_match;
    RETURN new_match;
  END IF;

  INSERT INTO public.waiting_queue (user_id, interests, want_gender, want_country, gender, country, is_premium)
  VALUES (me, COALESCE(p_interests, '{}'), p_want_gender, p_want_country, my_profile.gender, my_profile.country, my_profile.is_premium)
  ON CONFLICT (user_id) DO UPDATE
    SET interests = EXCLUDED.interests, want_gender = EXCLUDED.want_gender,
        want_country = EXCLUDED.want_country, gender = EXCLUDED.gender,
        country = EXCLUDED.country, is_premium = EXCLUDED.is_premium, joined_at = now();
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_queue() RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.waiting_queue WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.end_match(p_match_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me UUID := auth.uid();
BEGIN
  UPDATE public.matches SET ended_at = now(), ended_by = me
   WHERE id = p_match_id AND ended_at IS NULL AND (user_a = me OR user_b = me);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_match() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.matches WHERE ended_at IS NULL AND (user_a = auth.uid() OR user_b = auth.uid()) LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.join_queue(TEXT[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_match(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_match() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_match_member(UUID, UUID) TO authenticated;

-- ============ REALTIME ============
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;