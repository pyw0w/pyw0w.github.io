import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { saveTokens } from '../src/auth/oauth';

beforeEach(() => localStorage.clear());

function Probe() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span>auth:{String(isAuthenticated)}</span>
      <button onClick={logout}>out</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('reports authenticated when tokens exist', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('auth:true')).toBeInTheDocument();
  });

  it('logout clears auth', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => screen.getByText('out').click());
    expect(screen.getByText('auth:false')).toBeInTheDocument();
  });
});
