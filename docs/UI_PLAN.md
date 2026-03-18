# WARZONE — UI/UX Architecture Plan (Phase 1)

## Role: Lead UI/UX Architect

This document outlines the frontend blueprint for the WARZONE mobile application built in React Native. It defines the player journey, screen layouts, component architecture, and performance strategies required to deliver a chaotic, real-time fan experience.

---

## 🛑 Critical Design Principle: WARZONE IS NOT A SCORE APP

**WARZONE must never resemble traditional sports apps like Cricbuzz or ESPNcricinfo.** Those apps are for passive information consumption. WARZONE is designed for emotional participation, toxic rivalry, and fan warfare.

### Visual Tone & Atmosphere
- **The Arena:** Entering the app must feel like stepping into a digital stadium stand during a heated rivalry. 
- **Dark & Aggressive:** Deep dark theme as the unbreakable default. High contrast neon colors representing the Armies.
- **Loud & Fast:** The interface should feel alive. Bold, aggressive typography. Motion-heavy interactions.
- **Physical Feedback:** Heavy use of haptics (vibrating the phone) during Reaction Storms and Clutch Predictions.
- **Army Takeovers:** The UI visually transitions and floods with an Army's colors when they dominate the Toxicity Meter.

### The "Screenshot Worthy" Rule
This is a core growth engine. Every major screen must be instantly recognizable on Instagram or X.
When fans share a Toxicity Meter, a glowing Prediction result, or a Reaction Storm takeover, the visual identity must scream: **"This is from WARZONE."**

---

## 1. Complete Screen Flow (The Player Journey)

The mobile app follows a highly opinionated, fast funnel.

### Flow A: The Onboarding (First App Launch)
1. **Splash Screen**: Deep black, neon WARZONE logo pulses. Checks for existing auth token.
2. **Login Screen**: Minimalist input for phone number. "Enter the War" button.
3. **OTP Verifier**: Auto-reads OTP (Android) or manual input.
4. **The Draft (Army Selection)**: Horizontal snapping carousel of 10 IPL franchises. Dark, moody graphics for the teams. Once locked in, a severe modal warns: *"You are locked to this Army for the season. Proceed?"*
5. **Name Entry**: Enter gamer tag.
6. **Route -> Main Hub**

### Flow B: The Main Hub (Authenticated Landing)
1. **Header**: User Rank (e.g., "Recruit"), Username, and total War Points. Top right settings cog.
2. **Active Battlefield**: A large, glowing card showing the CURRENT LIVE MATCH. If their army is playing, it pulsates red.
3. **Upcoming Wars**: Horizontal scrolling list of future matches.
4. **Leaderboard Teaser**: Mini view of the top 3 players in their Army.

### Flow C: The War Room (The Core Experience)
*Transitions here when hitting "Join War" on a Live Match.*
1. **Top Bar (The HUD)**: 
   - Match Score summary (e.g., RCB: 140/3, CSK: 135/2)
   - Toxicity Meter (Dual progress bar pushing against each other: Home vs Away).
2. **The Prediction Modal (Z-Index 100)**:
   - When the backend fires a `NEW_PREDICTION` WebSocket event, a glowing modal drops from the top of the screen.
   - Text: "Will Virat hit a boundary this over? (Rewards: +50WP)"
   - Massive A/B buttons.
   - Self-destructing progress bar (15s timer).
3. **The Chaos Chat (Bottom 60% of screen)**:
   - Infinite scrolling list.
   - Messages from allies tinted green/blue. Enemies tinted deep red.
   - Input bar anchored to the keyboard. Submit button is a stylized arrow.

---

## 2. Wireframe-Level Layout

### Main Hub
```text
+---------------------------------------+
|  [Rank Icon] Username       [Points]  |
+---------------------------------------+
|                                       |
|    ==== ACTIVE BATTLEFIELD ====       |
|   +-------------------------------+   |
|   |         🔴 LIVE NOW           |   |
|   |   [RCB Logo]  vs  [CSK Logo]  |   |
|   |                               |   |
|   |      [ ENTER WAR ROOM ]       |   |
|   +-------------------------------+   |
|                                       |
|    ==== UPCOMING WARS ====            |
|   [Card 1]  [Card 2]  [Card 3]        |
|                                       |
|    ==== MY ARMY LEADERBOARD ====      |
|   1. 👑 Slayer99          8500 WP     |
|   2. 🥈 RCBizLife         7200 WP     |
|   3. 🥉 KGFanboy          6900 WP     |
+---------------------------------------+
|  [🏠 Home]    [🏆 Ranks]   [⚙️ Me]   |
+---------------------------------------+
```

### The War Room
```text
+---------------------------------------+
| < Back     RCB 140/3 | CSK 135/2      |
+---------------------------------------+
| [Toxicity Meter: RCB 80% <-> CSK 20% ]|
+---------------------------------------+
|    +-----------------------------+    |
|    | ⚡ NEW CLUTCH PREDICTION!  |    |
|    | Will Siraj take a wicket?   |    |
|    |  [ YES ]           [ NO ]   |    |
|    |  ======== 8s left =======   |    |
|    +-----------------------------+    |
|                                       |
|  [CSK_Fan] typical rcb collapse lmao  |
|  [KohliGod] stfu watch him cook       |
|  [RCB_King] 👑👑👑                    |
|  [Dhoni7] easy win for csk            |
|                                       |
| +-----------------------------------+ |
| | Type your battle cry...      [SEND] |
| +-----------------------------------+ |
+---------------------------------------+
```

---

## 3. Component Tree

A highly modular approach utilizing "Dumb" UI components and "Smart" structural containers.

```
App/
├── NavigationRoot/ (React Navigation)
│
├── Screens/
│   ├── Onboarding/
│   │   ├── LoginScreen
│   │   └── ArmyDraftScreen
│   │
│   ├── MainHub/
│   │   ├── DashboardScreen
│   │   └── LeaderboardScreen
│   │
│   └── Battlefield/
│       └── WarRoomScreen (Heavy WS Logic)
│
├── Features/ (Smart Components)
│   ├── Auth/
│   │   └── PhoneInputForm
│   ├── Matches/
│   │   ├── LiveMatchHeroCard
│   │   └── UpcomingMatchCarousel
│   ├── Chat/
│   │   ├── VirtualizedChatList
│   │   ├── ChatBubble (Enemy vs Ally variants)
│   │   └── ChatInputZone
│   └── Predictions/
│       ├── PredictionOverlayModal
│       └── TimerProgressBar
│
└── UI_Kit/ (Dumb Components)
    ├── WarzoneButton (Primary, Danger, Ghost)
    ├── WarzoneText (H1, H2, Body, Cyberpunk font)
    ├── GlassCard (Translucent background)
    └── ToxicityBar
```

---

## 4. State Management Strategy

To handle high-frequency WebSocket data without re-rendering the entire app:

1. **Global/Server State (TanStack Query / React Query)**
   - Used for REST APIs: Fetching user profile (`/me`), Live Matches (`/matches/live`), and submitting votes (`/predictions/:id/vote`).
   - Handles caching, infinite scrolling, and background refetching automatically.

2. **Real-time Transient State (Zustand)**
   - Used specifically for the **War Room**.
   - React Query is too slow for 50 chat messages per second. Zustand allows us to push UI state updates (Chat Arrays, Toxicity Scores, Active Prediction Modals) incredibly fast.
   - Stores the active WebSocket connection instance.

3. **Auth State (Secure Store + React Context)**
   - JWT tokens stored in `expo-secure-store`.
   - Simple React Context at the root to toggle the Navigation stack from `(Auth)` -> `(App)` based on token presence.

---

## 5. Accessibility (a11y)

In a fast-paced game, accessibility ensures fairness.

- **Dynamic Type**: All text components scale with system font settings.
- **Color Blindness**: 
  - Teams (e.g., RCB Red vs CSK Yellow) must not rely purely on color. Army logos/abbreviations must accompany all colored UI elements.
  - Toxicity bars will use distinct patterns or explicit numbers (80% vs 20%), not just red/green gradients.
- **Screen Readers**: 
  - The Live Chat will explicitly block screen readers (`importantForAccessibility="no-hide-descendants"`) because reading 50 messages a second will crash VoiceOver.
  - The **Prediction Modal** will immediately steal focus (`accessibilityLiveRegion="assertive"`) and read out the question and time remaining loudly.
- **Touch Targets**: All interactive elements (prediction A/B options) must be a minimum of `48x48dp`.

---

## 6. Mobile Responsiveness

- **Safe Area Context**: Utilize `react-native-safe-area-context` to prevent UI elements from bleeding under the iPhone Dynamic Island or Android bottom navigation bars.
- **Flexbox Layouts**: Hardcoded pixel heights are banned. UI components scale proportionally using flex metrics.
- **Keyboard Handling**: `KeyboardAvoidingView` is strictly implemented on the War Room screen so the chat pushes upward smoothly without hiding the text input.
- **Device Themes**: WARZONE is strictly **Dark Mode Only**. The aesthetics rely on neon accents against a #0A0A0A background. Light mode will be disabled via `app.json`.
