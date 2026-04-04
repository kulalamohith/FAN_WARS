# WARZONE — API Specification (Phase 1)

This contract defines the API boundaries for the mobile frontend and backend services for Phase 1.

> **Global Rate Limiting:** Unless specified otherwise, all authenticated endpoints default to `100 req / minute` per IP/User. Unauthenticated endpoints default to `20 req / minute`.

---

## 1. Authentication
*These endpoints are already implemented and tested.*

### 1.1 Login Stub
- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Auth Required:** No
- **Rate Limit:** 5 req / minute
- **Request Body:**
  ```json
  {
    "phone": "9998887776",
    "auth_provider": "otp" // or "truecaller"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "is_new_user": false,
    "token": "eyJhbG...",
    "user": { "id": "uuid", "username": "Warrior1", "rank": "Recruit", "army": "RCB" }
  }
  ```
  *(If `is_new_user` is true, token and user are omitted)*
- **Error Cases:**
  - `400 Bad Request`: Invalid phone number length.

### 1.2 Onboard New User
- **Method:** `POST`
- **URL:** `/api/v1/auth/onboard`
- **Auth Required:** No
- **Rate Limit:** 3 req / minute
- **Request Body:**
  ```json
  {
    "phone": "9998887776",
    "username": "Warrior1",
    "armyId": "uuid-of-rcb"
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "token": "eyJhbG...",
    "user": { "id": "uuid", "username": "Warrior1", "rank": "Recruit", "army": "RCB" }
  }
  ```
- **Error Cases:**
  - `409 Conflict`: Username or phone already registered.
  - `400 Bad Request`: Army ID does not exist.

### 1.3 Get Current Profile
- **Method:** `GET`
- **URL:** `/api/v1/auth/me`
- **Auth Required:** Yes (Bearer JWT)
- **Response Shape (200 OK):**
  ```json
  {
    "id": "uuid",
    "username": "Warrior1",
    "rank": "Recruit",
    "totalWarPoints": "1540",
    "army": { "id": "uuid", "name": "RCB", "colorHex": "#FF0000" }
  }
  ```
- **Error Cases:**
  - `401 Unauthorized`: Missing or invalid JWT.
  - `404 Not Found`: User deleted or missing.

---

## 2. Match & War Room Service
*To be built in API Gateway.*

### 2.1 Get Live Matches
- **Method:** `GET`
- **URL:** `/api/v1/matches/live`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Shape (200 OK):**
  ```json
  {
    "matches": [
      {
        "id": "match-uuid",
        "homeArmy": { "id": "uuid", "name": "RCB", "colorHex": "#FF0000" },
        "awayArmy": { "id": "uuid", "name": "CSK", "colorHex": "#FFFF00" },
        "status": "LIVE",
        "startTime": "2026-03-22T14:00:00Z",
        "warRoomId": "room-uuid"
      }
    ]
  }
  ```
- **Error Cases:** `401 Unauthorized`

### 2.2 Get War Room State
- **Method:** `GET`
- **URL:** `/api/v1/war-rooms/:id`
- **Auth Required:** Yes
- **Rate Limit:** 30 req / minute
- **Request Body:** None
- **Response Shape (200 OK):**
  ```json
  {
    "id": "room-uuid",
    "matchId": "match-uuid",
    "toxicity": {
      "homeScore": 850,
      "awayScore": 420
    },
    "activePredictions": [
      {
         "id": "pred-uuid",
         "question": "Will Kohli hit a 6 this over?",
         "optionA": "Yes",
         "optionB": "No",
         "pointsReward": 50,
         "expiresAt": "2026-03-22T14:05:00Z"
      }
    ] /* Only returns predictions with status = ACTIVE */
  }
  ```
- **Error Cases:**
  - `404 Not Found`: War room does not exist.
  - `401 Unauthorized`.

---

## 3. Predictions Service
*To be built in API Gateway.*

### 3.1 Submit Prediction Vote
- **Method:** `POST`
- **URL:** `/api/v1/predictions/:id/vote`
- **Auth Required:** Yes
- **Rate Limit:** 10 req / minute (Anti-spam)
- **Request Body:**
  ```json
  {
    "selectedOption": "A" // Must be "A" or "B"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vote locked in."
  }
  ```
- **Error Cases:**
  - `404 Not Found`: Prediction does not exist.
  - `400 Bad Request`: Prediction is no longer ACTIVE (time expired).
  - `409 Conflict`: User has already voted on this prediction.
  - `422 Unprocessable Entity`: Attempted to vote for a room your Army isn't playing in (optional MVP rule).

---

## 4. WebSockets (Live Chat & Events)
*To be built in Go (Gorilla WebSocket).*

### 4.1 Join War Room Channel
- **Protocol:** `ws://` or `wss://`
- **URL:** `/ws/v1/room/:id?token=YOUR_JWT`
- **Auth Required:** Yes (via inline `token` query param to bypass browser WS header limits).
- **Rate Limit:** 1 connection per User ID. Max message rate: 5 msg / sec.

**Client -> Server (Send Chat)**
```json
{
  "type": "CHAT_MSG",
  "payload": {
    "text": "Kohli is going to finish this!"
  }
}
```

**Server -> Client (Broadcast to Room)**
```json
{
  "type": "CHAT_MSG",
  "payload": {
    "userId": "uuid",
    "username": "Warrior1",
    "armyId": "uuid-of-rcb",
    "text": "Kohli is going to finish this!",
    "timestamp": "2026-03-22T14:10:00Z"
  }
}
```

**Server -> Client (Live Event Push - e.g., New Prediction)**
```json
{
  "type": "SYSTEM_EVENT",
  "payload": {
    "event": "NEW_PREDICTION",
    "data": {
       "id": "pred-uuid",
       "question": "Will Siraj take a wicket here?",
       "expiresAt": "2026-03-22T14:15:00Z"
    }
  }
}
```
