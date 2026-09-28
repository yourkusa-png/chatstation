# CHAT STATION controls update

## What will change
- Rename the visible app brand and page titles from StaticRoom to CHAT STATION.
- Add a camera-switch button that rotates between front and rear cameras when the device provides both.
- Keep the Filter button clearly visible before a chat starts and make gender and country selection available to everyone.
- Add a Like button during an active connection, with immediate visual feedback for both people.
- Add country selection to the signed-in menu, linked to the same match preference used by the filter panel.

## Technical details
- Replace the active video track safely when switching cameras, including the track already sent through WebRTC.
- Use the existing realtime signaling channel for likes; no database change is needed.
- Keep fixed control sizes and semantic design tokens so the two-panel chat layout remains stable on mobile and web.
- Verify the signed-in chat flow with device permissions and check desktop and mobile layouts.
