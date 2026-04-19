import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { router } from './app/router';
import { getBasePath } from './shared/api/catalog';

const redirect = sessionStorage.getItem('spa-redirect');
if (redirect) {
  sessionStorage.removeItem('spa-redirect');
  const basePath = getBasePath();
  const normalized = redirect.startsWith(basePath) ? redirect.slice(basePath.length) || '/' : redirect;
  window.history.replaceState({}, '', normalized);
} else if (window.location.search) {
  const currentParams = new URLSearchParams(window.location.search);
  if (currentParams.has('redirect')) {
    currentParams.delete('redirect');
    const nextSearch = currentParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
