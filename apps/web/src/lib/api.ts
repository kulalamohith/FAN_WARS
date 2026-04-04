/**
 * WARZONE — API Client
 * Centralized fetch wrapper for all backend calls.
 */

const BASE = '/api/v1';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('wz_token');

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
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
  },

  // ---- War Rooms ----
  warRooms: {
    get: (id: string) =>
      request<{ id: string; matchId: string; toxicity: any; activePredictions: any[] }>(`/war-rooms/${id}`),
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
    create: (name: string, matchId: string) =>
      request<{ success: boolean; bunker: any }>('/bunkers', {
        method: 'POST', body: JSON.stringify({ name, matchId }),
      }),
    join: (inviteCode: string) =>
      request<{ success: boolean; bunkerId: string }>('/bunkers/join', {
        method: 'POST', body: JSON.stringify({ inviteCode }),
      }),
    my: () => 
      request<{ success: boolean; bunkers: any[] }>('/bunkers/my'),
    get: (id: string) =>
      request<{ success: boolean; bunker: any }>(`/bunkers/${id}`),
  },

  // ---- Posts (Social Feed) ----
  posts: {
    feed: (sort: 'hot' | 'new' = 'hot', type?: string, cursor?: string) => {
      const params = new URLSearchParams({ sort, limit: '20' });
      if (type) params.set('type', type);
      if (cursor) params.set('cursor', cursor);
      return request<{ posts: any[]; nextCursor: string | null }>(`/posts/feed?${params}`);
    },
    create: (content: string, type: string = 'OPINION') =>
      request<{ success: boolean; post: any }>('/posts', {
        method: 'POST', body: JSON.stringify({ content, type }),
      }),
    react: (id: string, type: string) =>
      request<{ action: string; type: string }>(`/posts/${id}/react`, {
        method: 'POST', body: JSON.stringify({ type }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  },
};
