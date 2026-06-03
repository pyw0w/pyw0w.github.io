import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import CallbackPage from '../src/features/auth/CallbackPage';
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
it('exchanges code and stores tokens', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 1000 }), { status: 200 })));
    render(_jsx(AuthProvider, { children: _jsx(MemoryRouter, { initialEntries: ['/oauth/callback?code=xyz'], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/oauth/callback", element: _jsx(CallbackPage, {}) }), _jsx(Route, { path: "/lists", element: _jsx("div", { children: "lists page" }) })] }) }) }));
    await waitFor(() => expect(localStorage.getItem('shikimori_tokens')).toContain('"a"'));
});
