# Random Video Chat App (Omegle-style)

A random 1-to-1 video chat site: sign in, hit Start, get paired with a stranger, talk face to face, skip to the next person. Plus text chat, reporting, an admin review screen, and a pricing page for a future premium plan.

## Screens

1. **Landing (/)** — what the app is, safety rules, 18+ notice, "Start chatting" button.
2. **Sign up / Sign in (/auth)** — email + password and Google sign-in. New users pick a display name, gender and country.
3. **Chat room (/chat)** — the core screen:
   - Big stranger video, small self-preview
   - Start / Stop / Next (skip) buttons
   - Camera and mic mute toggles
   - Side text chat with the same stranger, "stranger is typing" indicator
   - Interest tags box — matches people who share a tag when possible
   - Report button on the stranger's video
   - Connection status: searching, connecting, connected, partner left
4. **Profile (/profile)** — display name, avatar, gender, country, interests, chat history count, delete account.
5. **Pricing (/pricing)** — Free vs Premium plans with feature comparison. Buttons show "Coming soon" since payments come later; premium-only controls in the app show an upgrade prompt.
6. **Admin (/admin)** — moderators only: queue of reports with reporter, reported user, reason, time; actions to dismiss, warn, ban 24h, or ban permanently. Also a list of banned users and basic stats (online users, matches today, reports open).

## How matching works

- Pressing Start puts you in a waiting queue with your preferences.
- The server pairs two waiting people into a "match" (shared interests first, then anyone available).
- Both sides get the match instantly over a realtime channel and connect their cameras directly to each other, browser to browser.
- Pressing Next ends the match for both and puts you back in the queue.
- Leaving the page or closing the tab ends the match and clears you from the queue.

## Safety

- Age confirmation checkbox before the first chat.
- Report with a reason (nudity, harassment, minor, spam, other); reporting also skips the person and blocks re-matching with them.
- Banned users can't enter the queue and see a ban notice with expiry.
- Users can't be matched with someone they've reported or blocked before.

## Subscription model (UI + gating only)

- **Free**: random matching, text chat, 1 interest tag, ads placeholder slot.
- **Premium**: gender filter, country filter, unlimited interest tags, no ads, priority position in the queue, "who liked you" style favorites list.
- Premium features are visibly present but locked with an upgrade prompt. A `subscriptions` record and an `is_premium` check are built in so real Stripe billing can be turned on later without rework.

## Technical details

- **Backend**: Lovable Cloud (Postgres, auth, realtime).
- **Video**: native browser WebRTC peer-to-peer, using public STUN servers. Signaling (offer/answer/ICE) travels over a Lovable Cloud realtime channel unique to each match. Note: without a TURN relay a small share of users behind strict corporate/mobile NATs will fail to connect; a TURN provider can be added later.
- **Tables**:
  - `profiles` — id (auth user), display_name, avatar_url, gender, country, interests[], age_confirmed, is_premium, created_at
  - `user_roles` + `app_role` enum (`admin`, `moderator`, `user`) with a `has_role()` security-definer function — roles never live on profiles
  - `waiting_queue` — user_id, interests[], want_gender, want_country, is_premium, joined_at
  - `matches` — id, user_a, user_b, started_at, ended_at, ended_by
  - `messages` — match_id, sender_id, body, created_at
  - `reports` — reporter_id, reported_id, match_id, reason, details, status, reviewed_by
  - `bans` — user_id, reason, expires_at (null = permanent)
  - `blocks` — blocker_id, blocked_id
  - `subscriptions` — user_id, plan, status, current_period_end
  - Every table gets explicit grants, RLS on, and policies scoped to `auth.uid()`; admin tables gated through `has_role`.
- **Matchmaking** runs in server functions (`joinQueue`, `leaveQueue`, `endMatch`, `reportUser`) with row locking so two people can't be paired into different matches at once. Realtime subscriptions on `matches` and `messages` push updates to both browsers.
- **Route protection**: `/chat`, `/profile`, `/admin` live behind the authenticated layout; `/admin` additionally checks the moderator/admin role server-side.
- Email/password auth and Google sign-in get enabled as part of the build.

## Build order

1. Enable Lovable Cloud, database schema, roles, RLS.
2. Auth pages + profile setup + route protection.
3. Chat screen UI with camera preview and controls.
4. Queue, matching, and realtime signaling for live video.
5. Text chat, typing indicator, skip/next flow.
6. Reports, blocks, bans, admin dashboard.
7. Pricing page and premium gating.

## Not included yet

- Real payment processing (pricing page is presentational).
- TURN relay servers for hard-NAT users.
- Group rooms or mobile apps.
