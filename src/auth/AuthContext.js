import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
import { loadTokens, clearTokens, saveTokens } from './oauth';
const Ctx = createContext(null);
export function AuthProvider({ children }) {
    const [authed, setAuthed] = useState(() => loadTokens() !== null);
    const login = useCallback((t) => {
        saveTokens(t);
        setAuthed(true);
    }, []);
    const logout = useCallback(() => {
        clearTokens();
        setAuthed(false);
    }, []);
    return _jsx(Ctx.Provider, { value: { isAuthenticated: authed, login, logout }, children: children });
}
export function useAuth() {
    const v = useContext(Ctx);
    if (!v)
        throw new Error('useAuth must be used within AuthProvider');
    return v;
}
