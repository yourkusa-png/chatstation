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

  SELECT id INTO new_match FROM public.matches
   WHERE ended_at IS NULL AND (user_a = me OR user_b = me) LIMIT 1;
  IF new_match IS NOT NULL THEN RETURN new_match; END IF;

  PERFORM pg_advisory_xact_lock(918273645);

  SELECT q.* INTO partner
  FROM public.waiting_queue q
  WHERE q.user_id <> me
    AND NOT public.is_banned(q.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = me AND b.blocked_id = q.user_id) OR (b.blocker_id = q.user_id AND b.blocked_id = me))
    AND (p_want_gender IS NULL OR q.gender = p_want_gender)
    AND (p_want_country IS NULL OR q.country = p_want_country)
    AND (q.want_gender IS NULL OR my_profile.gender = q.want_gender)
    AND (q.want_country IS NULL OR my_profile.country = q.want_country)
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