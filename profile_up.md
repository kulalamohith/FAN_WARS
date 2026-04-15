# Clickable Usernames → Profile Modal (All Chat Areas)

## Current State

| Area | Username Clickable? | Opens Profile? | Notes |
|------|-------------------|----------------|-------|
| **Live War Room** (`WarRoomPage.tsx`) | ❌ No | ❌ No | Username is a plain `<span>`, not a `<button>`. Only has a `[1v1 SD]` button next to it |
| **Private Bunker** (`BunkerPage.tsx`) | ✅ Yes | ✅ Yes | Already implemented! Username is a `<button>` that calls `setProfileUser(...)`, and `QuickProfileModal` is rendered at bottom |
| **Posts** (`PostsPage.tsx`) | ✅ Yes | ✅ Yes | Already implemented! Post author name is a `<button>` with `onUserClick` → `QuickProfileModal` |

**So the only missing piece is the Live War Room chat.**

---

## Proposed Changes

### 1. WarRoomPage.tsx — Make chat usernames clickable

**What changes:**
- Add `profileUser` state (same pattern as BunkerPage)
- Import `QuickProfileModal` + `QuickProfileUser` type
- Convert the username `<span>` (line 383) into a clickable `<button>` that sets `profileUser`
- Render `<QuickProfileModal>` at the bottom of the component (same pattern as BunkerPage line 589-591)

**Data available in each chat message (`msg`):**
- `msg.userId` ✅
- `msg.username` ✅
- `msg.rank` ✅ (used with RankBadge already)
- `msg.armyId` ✅ (army name string)

These map directly to `QuickProfileUser { id, username, rank, armyName }`.

---

## Files to Modify

| File | Change |
|------|--------|
| `WarRoomPage.tsx` | Add `profileUser` state, import QuickProfileModal, make username clickable, render modal |

**That's it — just 1 file.** BunkerPage and PostsPage already have this working.

---

## No Open Questions

This is straightforward — uses the exact same pattern already established in BunkerPage and PostsPage.
