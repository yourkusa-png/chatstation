# Chat controls and messaging upgrade

## What will change
- Remove country selection from the account menu so it appears only in the chat filter.
- Refine the filter panel with clear Country, Gender, and Interests controls, searchable/scannable country choices, and a visible summary of the active match preferences.
- Place camera, microphone, filter, and rotate controls in stable groups that do not cover messages or shift on mobile.
- Make camera rotation reliably switch between available front/rear cameras, preserve the current camera on/off state, replace the live call video track, prevent repeat taps while switching, and show clear feedback when a second camera is unavailable.
- Add an emoji picker beside the message field; selecting an emoji inserts it at the cursor without sending unexpectedly.
- Add a GIF button and smooth picker with trending GIFs, search, loading/empty/error states, and tap-to-send during an active chat.
- Render GIF messages as contained media in the chat stream while keeping ordinary text messages unchanged.
- Polish transitions, button states, touch targets, spacing, and reduced-motion behavior for a professional mobile and web experience.

## Technical details
- Simplify `SiteHeader` by removing its country-related props and menu controls; the chat filter remains the single source of match preferences.
- Track available video input IDs after permission is granted and rotate through them using `replaceTrack` for an active WebRTC connection.
- Reuse the existing authenticated GIF search function and connected GIF provider.
- Extend chat messages with an explicit text/GIF kind and optional GIF URL through a Lovable Cloud migration, preserving existing rows as text and retaining current member-only access rules and grants.
- Keep emoji insertion client-side and use the existing realtime message subscription for both text and GIF delivery.

## Verification
- Confirm the account menu has no country selector and the chat filter applies Country and Gender to the next match.
- Test permission denied, one-camera, two-camera, pre-call, and active-call rotate states where hardware permits.
- Verify emoji insertion, GIF search/send, realtime receipt, message history rendering, and failure states.
- Check the signed-in chat screen at phone and desktop sizes, then confirm the latest build and browser console are clean.
