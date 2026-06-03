import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { loadTokens, clearTokens, saveTokens } from './oauth';

interface AuthState {
  isAuthenticated: boolean;
  login: (t: { access_token: string; refresh_token: string; expires_in: number }) => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => loadTokens() !== null);

  const login = useCallback((t: { access_token: string; refresh_token: string; expires_in: number }) => {
    saveTokens(t);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAuthed(false);
  }, []);

  return <Ctx.Provider value={{ isAuthenticated: authed, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
