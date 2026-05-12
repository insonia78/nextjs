const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001';
const NOTIFY_URL = process.env.NEXT_PUBLIC_NOTIFY_URL || 'http://localhost:4004';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// Auth API
export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const res = await fetch(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${AUTH_URL}/users/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },
};

// Teams API
export const teamsApi = {
  create: async (name: string) => {
    const res = await fetch(`${AUTH_URL}/teams`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${AUTH_URL}/teams/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  addMember: async (teamId: string, userId: string) => {
    const res = await fetch(`${AUTH_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  getMembers: async (teamId: string) => {
    const res = await fetch(`${AUTH_URL}/users/team/${teamId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },
};

// Notifications API
export const notifyApi = {
  send: async (userId: string, message: string, type?: string) => {
    const res = await fetch(`${NOTIFY_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, type }),
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return res.json();
  },

  getForUser: async (userId: string, limit = 20) => {
    const res = await fetch(`${NOTIFY_URL}/notify/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markRead: async (userId: string, notificationId: string) => {
    const res = await fetch(`${NOTIFY_URL}/notify/${userId}/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },
};
