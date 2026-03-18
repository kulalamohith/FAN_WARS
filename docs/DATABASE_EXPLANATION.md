# WARZONE — Database Schema Explanation
*A simple breakdown of how our digital stadium stores data.*

### 1. The Core Group: Armies (`armies`)
**Purpose:** The 10 real IPL teams.
- **Constraints:** `name` is unique so we don't accidentally create two RCBs.
- **Why no Soft Deletes?** Armies are permanent. You don't delete CSK.
- **Audit:** We track exactly when they are created.

### 2. The Fans: Users (`users`)
**Purpose:** Every fan who signs up and joins an Army.
- **Indexes:** We index `totalWarPoints` descending, so fetching the "Top 100 Warriors" leaderboard is instant, avoiding heavy scanning of all 500,000 users.
- **Relations:** A user points to an `Army`. The database `FOREIGN KEY` enforces that a user cannot join a phantom team.
- **Soft Delete:** We added `deletedAt` and `isActive`. If a user deletes their account, we keep their row for data integrity but flag it as deleted so they disappear from the UI. This is legally required by the DPDP Act (India).

### 3. The Battlefield: Matches and War Rooms (`matches`, `war_rooms`)
**Purpose:** A real cricket match between two Armies, and the digital chat room attached to it.
- **Relations:** A War Room is deleted (`CASCADE`) immediately if its parent Match is deleted.
- **Indexes:** We index `[status, startTime]` on matches so the app instantly knows which matches are "LIVE" right now without scanning historical games.

### 4. The Game: Predictions and Ledgers (`predictions`, `prediction_ledger`)
**Purpose:** The Clutch Prediction popups during the match (e.g., "Will Kohli hit a 6?"), and the immutable ledger of what fans voted for.
- **Ledger Constraints:** We enforce a `UNIQUE` lock matching `userId` + `predictionId`. This means the database **physically prevents** a user from answering the same prediction twice, even if they spam requests.
- **Audit (Pro feature):** The Ledger tracks `clientIp`. Because the Ledger controls `Points`, it is the most targeted table for hackers. If someone writes a bot to guess predictions, we can ban them by IP.
- **Relations:** Ledgers are automatically destroyed (`CASCADE`) if a User is deleted or if an Admin deletes a botched Prediction.

### Summary of "Pro" Features Added:
1. **Explicit Types:** Used `UUID` instead of heavy strings, and `TIMESTAMPTZ` to prevent timezone bugs.
2. **Soft Deletes:** Essential for real consumer apps to gracefully hide data without breaking foreign keys.
3. **Compound Indexes:** Speed up the exact queries the app will run (e.g., scanning the leaderboard).
4. **Referential Rules:** (`ON DELETE RESTRICT` vs `ON DELETE CASCADE`) ensures we don't end up with "ghost" data if a parent record is removed.
