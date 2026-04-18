/**
 * WARZONE — API Client
 * Centralized fetch wrapper for all backend calls.
 */

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
// Ensure no trailing slash to avoid double slashes in paths like ${BASE}${url}
const BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('wz_token');

  const hdrs: Record<string, string> = {};
  if (token) hdrs['Authorization'] = `Bearer ${token}`;
  if (options.body) hdrs['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...hdrs, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));

    // Auto-logout on expired / invalid token
    // BUT skip if we're already on the login page or if this is an auth request (signin/signup)
    if (res.status === 401) {
      const isAuthEndpoint = url.startsWith('/auth/');
      const isOnLoginPage = window.location.pathname === '/login';

      if (!isAuthEndpoint && !isOnLoginPage) {
        localStorage.removeItem('wz_token');
        localStorage.removeItem('wz_user');
        window.location.href = '/login';
      }

      throw new Error(err.message || 'Invalid email or password');
    }

    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ---- Auth ----
export const api = {
  auth: {
    signin: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/signin', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    sendOtp: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/send-otp', {
        method: 'POST', body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, otp: string) =>
      request<{ success: boolean; email: string; userExists: boolean }>('/auth/verify-otp', {
        method: 'POST', body: JSON.stringify({ email, otp }),
      }),
    signup: (email: string, password: string, username: string, armyId: string) =>
      request<{ token: string; user: any; message: string }>('/auth/signup', {
        method: 'POST', body: JSON.stringify({ email, password, username, armyId }),
      }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST', body: JSON.stringify({ email }),
      }),
    resetPassword: (email: string, otp: string, newPassword: string) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST', body: JSON.stringify({ email, otp, newPassword }),
      }),
    me: () =>
      request<{ id: string; username: string; rank: string; totalWarPoints: string; army: any }>('/auth/me'),
  },

  // ---- Matches ----
  matches: {
    live: (page = 1, limit = 10) =>
      request<{ matches: any[]; meta: any }>(`/matches/live?page=${page}&limit=${limit}`),
    viewers: () => request<{ counts: Record<string, number>, toxicity: Record<string, { homeScore: number, awayScore: number }> }>('/matches/viewers'),
  },

  // ---- War Rooms ----
  warRooms: {
    get: (id: string) =>
      request<{ id: string; matchId: string; toxicity: any; activePredictions: any[] }>(`/war-rooms/${id}`),
    adminEvent: (id: string, eventType: string, payload: any) =>
      request<{ success: boolean; }>(`/war-rooms/${id}/admin-events`, {
        method: 'POST', body: JSON.stringify({ eventType, payload })
      }),
  },

  // ---- Predictions ----
  predictions: {
    vote: (id: string, selectedOption: 'A' | 'B') =>
      request<{ success: boolean; message: string }>(`/predictions/${id}/vote`, {
        method: 'POST', body: JSON.stringify({ selectedOption }),
      }),
    trigger: (matchId: string, payload: { questionText: string; optionA: string; optionB: string; pointsReward: number; durationMs: number }) =>
      request<{ success: boolean; prediction: any }>(`/predictions/trigger/${matchId}`, {
        method: 'POST', body: JSON.stringify(payload),
      }),
    resolve: (id: string, correctOption: 'A' | 'B') =>
      request<{ success: boolean; message: string }>(`/predictions/${id}/resolve`, {
        method: 'POST', body: JSON.stringify({ correctOption }),
      }),
  },

  // ---- Leaderboard ----
  leaderboard: {
    getTop: () => request<{ success: boolean; leaderboard: any[] }>('/leaderboard'),
    armies: () => request<{ success: boolean; armies: any[] }>('/leaderboard/armies'),
    teamContext: () => request<any>('/leaderboard/team-context'),
    badgesList: () => request<{ success: boolean; badges: any[] }>('/leaderboard/badges-list'),
    badgeLeaderboard: (key: string) => {
      const token = localStorage.getItem('wz_token');
      return fetch(`${BASE}/leaderboard/badges/${key}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).then(res => res.json());
    },
  },

  // ---- Roasts ----
  roasts: {
    feed: (sort: 'viral' | 'new' = 'viral', armyId?: string, cursor?: string) => {
      const params = new URLSearchParams({ sort, limit: '20' });
      if (armyId) params.set('armyId', armyId);
      if (cursor) params.set('cursor', cursor);
      return request<{ roasts: any[]; nextCursor: string | null }>(`/roasts/feed?${params}`);
    },
    create: (content: string, targetArmyId: string) =>
      request<{ success: boolean; roast: any }>('/roasts', {
        method: 'POST', body: JSON.stringify({ content, targetArmyId }),
      }),
    upvote: (id: string) =>
      request<{ success: boolean; action: string; newCount: number; isLegendary?: boolean }>(`/roasts/${id}/upvote`, {
        method: 'POST',
      }),
  },

  // ---- Armies (for Draft screen) ----
  armies: {
    list: () => request<any[]>('/armies'),
  },

  // ---- Bunkers (Private Watch Rooms) ----
  bunkers: {
    create: (name: string, options: { matchId?: string; homeTeam?: string; awayTeam?: string }) =>
      request<{ success: boolean; bunker: any }>('/bunkers', {
        method: 'POST', body: JSON.stringify({ name, ...options }),
      }),
    join: (inviteCode: string) =>
      request<{ success: boolean; bunkerId: string }>('/bunkers/join', {
        method: 'POST', body: JSON.stringify({ inviteCode }),
      }),
    my: () => 
      request<{ success: boolean; bunkers: any[] }>('/bunkers/my'),
    get: (id: string) =>
      request<{ success: boolean; bunker: any }>(`/bunkers/${id}`),
    kickMember: (id: string, userId: string) =>
      request<{ success: boolean }>(`/bunkers/${id}/members/${userId}`, { method: 'DELETE' }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/bunkers/${id}`, { method: 'DELETE' }),
  },

  // ---- Posts (Social Feed) ----
  posts: {
    feed: (sort: 'hot' | 'new' = 'new', mine: boolean = false, type?: string, cursor?: string) => {
      const params = new URLSearchParams({ sort, limit: '20' });
      if (mine) params.set('mine', 'true');
      if (type) params.set('type', type);
      if (cursor) params.set('cursor', cursor);
      return request<{ posts: any[]; nextCursor: string | null }>(`/posts/feed?${params}`);
    },
    create: (content: string, type: string = 'OPINION', imageUrl?: string) =>
      request<{ success: boolean; post: any }>('/posts', {
        method: 'POST', body: JSON.stringify({ content, type, imageUrl }),
      }),
    react: (id: string, type: string) =>
      request<{ action: string; type: string }>(`/posts/${id}/react`, {
        method: 'POST', body: JSON.stringify({ type }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
    upload: (formData: FormData) => {
      const token = localStorage.getItem('wz_token');
      return fetch(`${BASE}/posts/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }).then(res => res.json());
    },
  },

  // ---- Profile ----
  profile: {
    me: () =>
      request<any>('/profile/me'),
    dailyClaim: () =>
      request<{ success: boolean; alreadyClaimed: boolean; pointsAwarded?: number; streakBonus?: number; streakMilestone?: string | null; totalAwarded?: number; loginStreak: number; message: string }>('/profile/daily-claim', {
        method: 'POST',
      }),
    user: (username: string) =>
      request<any>(`/profile/${username}`),
    search: (query: string) =>
      request<{ users: any[] }>(`/profile/search?q=${query}`),
    pinBadge: (badgeKey: string, pin: boolean) =>
      request<{ success: boolean; message: string }>('/profile/badges/pin', {
        method: 'POST', body: JSON.stringify({ badgeKey, pin }),
      }),
    update: (data: { bio?: string; username?: string; removeProfilePicture?: boolean }) =>
      request<{ success: boolean; message: string; token?: string }>('/profile/me', {
        method: 'PUT', body: JSON.stringify(data),
      }),
    getHistory: () =>
      request<{ success: boolean; history: any[] }>('/profile/me/history'),
    upload: (formData: FormData) => {
      const token = localStorage.getItem('wz_token');
      return fetch(`${BASE}/profile/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }).then(res => res.json());
    },
    traitorSwitch: (winningTeamName: string, pointsReward: number) =>
      request<{ success: boolean; message: string; token: string; user: any }>('/profile/traitor-switch', {
        method: 'POST', body: JSON.stringify({ winningTeamName, pointsReward }),
      }),
    payEntry: (amount: number, source: string) =>
      request<{ success: boolean; message: string; newTotalPoints: number }>('/profile/pay-entry', {
        method: 'POST', body: JSON.stringify({ amount, source }),
      }),
  },

  // ---- Duels (Sniper Duels — Global Feed) ----
  duels: {
    stats: () => request<{ success: boolean; stats: { totalDuels: number; wins: number; losses: number; points: number } }>('/duels/stats'),
    my: () => request<{ success: boolean; duels: any[] }>('/duels/my'),
    save: (data: {
      topicText: string;
      topicCategory: string;
      player1: { id: string; username: string; army: string; armyColor: string };
      player2: { id: string; username: string; army: string; armyColor: string };
      messages: any[];
      startedAt?: number;
      endedAt?: number;
    }) =>
      request<{ success: boolean; duel: { id: string } }>('/duels', {
        method: 'POST', body: JSON.stringify(data),
      }),
    feed: (sort: 'recent' | 'hype' = 'recent', cursor?: string) => {
      const params = new URLSearchParams({ sort, limit: '20' });
      if (cursor) params.set('cursor', cursor);
      return request<{ duels: any[]; nextCursor: string | null }>(`/duels/feed?${params}`);
    },
    vote: (id: string, votedFor: 'player1' | 'player2') =>
      request<{ action: string; votedFor: string | null }>(`/duels/${id}/vote`, {
        method: 'POST', body: JSON.stringify({ votedFor }),
      }),
    hype: (id: string) =>
      request<{ action: string; hyped: boolean }>(`/duels/${id}/hype`, {
        method: 'POST',
      }),
  },
};
