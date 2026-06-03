import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { saveTokens } from '../src/auth/oauth';
beforeEach(() => localStorage.clear());
function Probe() {
    const { isAuthenticated, logout } = useAuth();
    return (_jsxs("div", { children: [_jsxs("span", { children: ["auth:", String(isAuthenticated)] }), _jsx("button", { onClick: logout, children: "out" })] }));
}
describe('AuthContext', () => {
    it('reports authenticated when tokens exist', () => {
        saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
        render(_jsx(AuthProvider, { children: _jsx(Probe, {}) }));
        expect(screen.getByText('auth:true')).toBeInTheDocument();
    });
    it('logout clears auth', () => {
        saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
        render(_jsx(AuthProvider, { children: _jsx(Probe, {}) }));
        act(() => screen.getByText('out').click());
        expect(screen.getByText('auth:false')).toBeInTheDocument();
    });
});
