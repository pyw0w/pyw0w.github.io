import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import CallbackPage from '../src/features/auth/CallbackPage';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

it('exchanges code and stores tokens', async () => {
  vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 1000 }), { status: 200 })));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/oauth/callback?code=xyz']}>
        <Routes>
          <Route path="/oauth/callback" element={<CallbackPage />} />
          <Route path="/lists" element={<div>lists page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await waitFor(() => expect(localStorage.getItem('shikimori_tokens')).toContain('"a"'));
});
