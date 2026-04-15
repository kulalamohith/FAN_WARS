# Rename Polls → Duels + Add Duel Status Tab

## Problem Statement

Two issues with the current challenge system:

1. **Single-challenge blindspot**: The `incomingChallenge` state is a single object (`DuelChallengePayload | null`). If 3 people challenge you at once, you only ever see the **last one** — the other 2 silently get overwritten and lost.
2. **No visibility of outgoing challenges**: After you challenge someone, there's zero UI feedback — you don't know if they're considering it, if it's pending, or if they just never saw it.
3. **Tab naming**: "Polls" is confusing since the feature is entirely about Duels.

---

## Proposed Changes

### 1. Navigation & Naming

- **Sidebar**: Rename `POLLS` → `DUELS`
- **Route**: Change `/polls` → `/duels`
- **Page title**: `⚔️ WAR POLLS` → `⚔️ SNIPER DUELS`
- **Remove** the polls/duels sub-tab toggle — the page becomes purely the Duels section

---

### 2. Duel Status Tab (the core new feature)

Add a **third tab** inside DuelsLobby: **📋 DUEL STATUS** alongside `🎯 LIVE DUEL` and `📜 MY DUELS`.

The Duel Status tab shows two sections:

**Section A — Incoming Challenges (need your response)**
- List of ALL pending challenges from other users (not just the latest one)
- Each card shows: Challenger name, topic, timestamp
- **Accept / Decline** buttons on each card
- Badge count on the tab = number of unresponded incoming challenges

**Section B — Outgoing Challenges (waiting for response)**
- List of challenges YOU sent that haven't been accepted/declined yet
- Each card shows: Target user, topic, timestamp
- **Cancel** button to withdraw challenge
- Status indicator: ⏳ Waiting...

---

### 3. Multi-Challenge Queue Fix (backend + frontend store)

**Current bug**: `incomingChallenge` is a single object. If 3 people challenge you at once, only the LAST one is stored — the other 2 are silently lost.

**Fix**:
- `incomingChallenge: single | null` → `incomingChallenges: array[]`
- New: `outgoingChallenges: array[]` — tracks what user has sent
- On new challenge received → **push** to array (not overwrite)
- On accept/decline → remove that specific entry from array
- New socket event: `cancel_duel_challenge` to withdraw a sent challenge
- The top notification toast still shows the LATEST challenge for quick action, but Duel Status tab shows the full queue

---

### 4. Files to Modify

| File | Change |
|------|--------|
| `navigation.tsx` | Rename POLLS → DUELS, update path |
| `App.tsx` | Update route `/polls` → `/duels` |
| `PollsPage.tsx` | Remove polls sub-tab, rename to pure Duels page |
| `DuelsLobby.tsx` | Add 3rd "DUEL STATUS" tab with incoming/outgoing sections |
| `globalSocketStore.ts` | Convert single challenge to array queue, add outgoing tracking |
| `websocket.ts` (server) | Add cancel_duel_challenge event |
| `GlobalDuelManager.tsx` | Update to reference array instead of single object |

---

## Questions For You

1. **Challenge expiry**: Should challenges auto-expire after 5 minutes? (prevents stale "Waiting..." if someone ignores your challenge)

2. **Keep Polls placeholder?**: The "Coming Soon" polls section — remove it entirely, or keep it hidden for future?

3. **Anything else** you want in the Duel Status tab?

---

Let me know your answers and I'll start building!
