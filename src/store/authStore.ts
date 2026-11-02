import { create } from 'zustand';
import { apiClient, ApiException, setAuthToken } from '@/lib/apiClient';
import { getOrCreateDeviceId } from '@/lib/deviceId';
import { PORTAL_ROLES, User } from '@/lib/types';

const TOKEN_KEY = 'lasg_pts_admin_token';

interface AuthResult {
  accessToken: string;
  // The login endpoint's own response only carries {id, phoneNumber,
  // role} — it predates fullName/email being added to the token
  // response. We fetch GET /auth/me right after login instead of
  // trusting this, same reasoning as the fix already made on the
  // mobile app's jwt.strategy.ts (see lasg-pts-backend).
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  async restore() {
    set({ status: 'restoring' });
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    setAuthToken(token);
    try {
      const user = await apiClient.get<User>('/auth/me');
      if (!PORTAL_ROLES.includes(user.role)) {
        setAuthToken(null);
        window.localStorage.removeItem(TOKEN_KEY);
        set({ status: 'unauthenticated', user: null, error: 'This account does not have portal access.' });
        return;
      }
      set({ status: 'authenticated', user });
    } catch {
      setAuthToken(null);
      window.localStorage.removeItem(TOKEN_KEY);
      set({ status: 'unauthenticated', user: null });
    }
  },

  async login(phoneNumber: string, password: string) {
    set({ error: null });
    try {
      const result = await apiClient.post<AuthResult>('/auth/login', {
        phoneNumber,
        password,
        deviceId: getOrCreateDeviceId(),
      });
      window.localStorage.setItem(TOKEN_KEY, result.accessToken);
      setAuthToken(result.accessToken);
      const user = await apiClient.get<User>('/auth/me');
      if (!PORTAL_ROLES.includes(user.role)) {
        window.localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        set({ error: 'This account is registered as a field agent and does not have web portal access.' });
        return;
      }
      set({ user, status: 'authenticated' });
    } catch (error) {
      window.localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      set({ error: error instanceof ApiException ? error.message : 'Login failed.' });
    }
  },

  logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    set({ user: null, status: 'unauthenticated' });
  },
}));
