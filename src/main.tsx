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
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
