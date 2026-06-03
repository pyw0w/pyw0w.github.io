import { jsx as _jsx } from "react/jsx-runtime";
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ListsPage from '../src/features/lists/ListsPage';
it('prompts to log in when unauthenticated', () => {
    localStorage.clear();
    const qc = new QueryClient();
    render(_jsx(QueryClientProvider, { client: qc, children: _jsx(AuthProvider, { children: _jsx(MemoryRouter, { children: _jsx(ListsPage, {}) }) }) }));
    expect(screen.getByText(/Войдите через Shikimori/)).toBeInTheDocument();
});
