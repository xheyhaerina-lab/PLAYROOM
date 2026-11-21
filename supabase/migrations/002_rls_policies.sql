-- ==============================================================================
-- PLAYROOM — Migration 002: Row Level Security (RLS) & Server Triggers
-- ==============================================================================

-- Helper: Check whether current auth.uid() is an admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = uid
  );
$$;

-- Trigger: Automatically create profile when a new auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  safe_username TEXT;
BEGIN
  base_username := regexp_replace(
    lower(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))),
    '[^a-z0-9_]', '_', 'g'
  );
  IF char_length(base_username) < 3 THEN
    base_username := 'player_' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  safe_username := substr(base_username, 1, 18) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);

  INSERT INTO public.profiles (id, username, display_name, email, preferred_language)
  VALUES (
    NEW.id,
    safe_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', safe_username),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- PROFILES:
-- Users can read their own full profile; admins can read all; other users read via public_profiles view.
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update ONLY safe profile fields (trigger below blocks xp/level/subscription_status/is_suspended escalation)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent users from modifying privileged columns on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.total_games_played := OLD.total_games_played;
    NEW.wins := OLD.wins;
    NEW.subscription_status := OLD.subscription_status;
    NEW.is_suspended := OLD.is_suspended;
    NEW.email := OLD.email;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- ADMIN ROLES: only admins can view; mutations require service role
CREATE POLICY "admin_roles_select_admin"
  ON public.admin_roles FOR SELECT
  USING (public.is_admin());

-- GAMES: anyone can view active games; admins can manage
CREATE POLICY "games_select_public"
  ON public.games FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "games_admin_all"
  ON public.games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GAME QUESTIONS: NEVER expose correct_option_index directly to clients!
-- Only admins can query game_questions directly; players fetch sanitized questions via server API.
CREATE POLICY "game_questions_admin_only"
  ON public.game_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MYSTERY SCENARIOS: same, admins manage directly; clients fetch sanitized stage data via server API
CREATE POLICY "mystery_scenarios_admin_only"
  ON public.mystery_scenarios FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ROOMS & ROOM PLAYERS:
CREATE POLICY "rooms_select_visible"
  ON public.rooms FOR SELECT
  USING (
    is_private = FALSE
    OR host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = rooms.id AND rp.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "room_players_select_participants"
  ON public.room_players FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = room_players.room_id AND rp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_players.room_id AND r.is_private = FALSE)
    OR public.is_admin()
  );

-- GAME SESSIONS, PLAYERS, ANSWERS:
-- Read-only for session participants; mutations occur strictly via trusted backend service role!
CREATE POLICY "game_sessions_select_participant"
  ON public.game_sessions FOR SELECT
  USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.session_id = game_sessions.id AND gp.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "game_players_select_participant"
  ON public.game_players FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.session_id = game_players.session_id AND gp.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "game_answers_select_own"
  ON public.game_answers FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- FRIENDS & REQUESTS:
CREATE POLICY "friend_requests_select_involved"
  ON public.friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "friend_requests_insert_sender"
  ON public.friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND sender_id <> receiver_id);

CREATE POLICY "friend_requests_update_receiver"
  ON public.friend_requests FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "friends_select_own"
  ON public.friends FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friends_delete_own"
  ON public.friends FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ACHIEVEMENTS & DAILY CHALLENGES:
CREATE POLICY "achievements_select_all"
  ON public.achievements FOR SELECT
  USING (TRUE);

CREATE POLICY "user_achievements_select_own_or_public"
  ON public.user_achievements FOR SELECT
  USING (TRUE);

CREATE POLICY "daily_challenges_select_all"
  ON public.daily_challenges FOR SELECT
  USING (TRUE);

CREATE POLICY "daily_challenges_admin_all"
  ON public.daily_challenges FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_challenges_select_own"
  ON public.user_challenges FOR SELECT
  USING (user_id = auth.uid());

-- LEADERBOARD ENTRIES: public read, server-only write
CREATE POLICY "leaderboard_entries_select_all"
  ON public.leaderboard_entries FOR SELECT
  USING (TRUE);

-- SUBSCRIPTION PLANS: public read, admin write
CREATE POLICY "subscription_plans_select_active"
  ON public.subscription_plans FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "subscription_plans_admin_all"
  ON public.subscription_plans FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS & PAYMENTS:
-- Strict isolation: users can only read their OWN records; only trusted service role writes!
CREATE POLICY "subscriptions_select_own_or_admin"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments_select_own_or_admin"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "webhook_events_select_admin"
  ON public.webhook_events FOR SELECT
  USING (public.is_admin());

-- NOTIFICATIONS:
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- REPORTS:
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND reporter_id <> reported_user_id);

CREATE POLICY "reports_select_own_or_admin"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

CREATE POLICY "reports_admin_update"
  ON public.reports FOR UPDATE
  USING (public.is_admin());
