import { create } from 'zustand';
import type { User, UserRole } from '@/types';

/** Token key — stored in sessionStorage (tab-scoped, cleared on tab close). */
const TOKEN_KEY = 'sm_token';
/** Role key — stored in localStorage for cross-tab redirect HINT ONLY. Never used for route protection. */
const ROLE_KEY = 'sm_role';
/** User key — stored in sessionStorage to survive refresh but stay tab-scoped. */
const USER_KEY = 'sm_user';

interface AuthStore {
    token: string | null;
    user: User | null;
    role: UserRole | null;
    setAuth: (token: string, user: User) => void;
    setUser: (user: User) => void;
    clearAuth: () => void;
}

const getStoredUser = (): User | null => {
    try {
        const val = sessionStorage.getItem(USER_KEY);
        return val ? JSON.parse(val) : null;
    } catch {
        return null;
    }
};

/**
 * CRITICAL: Role is derived EXCLUSIVELY from the user object in sessionStorage
 * (tab-scoped). We do NOT read role from localStorage directly, because localStorage
 * is shared across tabs and a stale role from a previous admin/operator session
 * could leak into the current tab's ProtectedRoute checks, causing unauthorized
 * admin API calls (e.g. 403s on /api/v1/admin/*) for field_technical_team users.
 */
const getStoredRole = (): UserRole | null => {
    const user = getStoredUser();
    if (user?.role) return user.role as UserRole;
    return null;
};

export const useAuthStore = create<AuthStore>()((set) => ({
    // Rehydrate from sessionStorage on page refresh (same tab)
    token: sessionStorage.getItem(TOKEN_KEY),
    user: getStoredUser(),
    // Role is derived from the user object — NEVER from localStorage independently.
    role: getStoredRole(),

    setAuth: (token, user) => {
        // Store sensitive token in sessionStorage only (tab-scoped, cleared on tab close)
        sessionStorage.setItem(TOKEN_KEY, token);
        // Store non-sensitive role hint in localStorage for login redirect logic ONLY
        localStorage.setItem(ROLE_KEY, user.role);
        // Persist user object in sessionStorage (tab-scoped)
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ token, user, role: user.role as UserRole });
    },

    setUser: (user) => {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        // Also sync the role from the updated user object
        set({ user, role: user.role as UserRole });
    },

    clearAuth: () => {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        sessionStorage.removeItem(USER_KEY);
        set({ token: null, user: null, role: null });
    },
}));
