import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ListsPage from '../src/features/lists/ListsPage';

it('prompts to log in when unauthenticated', () => {
  localStorage.clear();
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter><ListsPage /></MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(screen.getByText(/Войдите в аккаунт/)).toBeInTheDocument();
});
