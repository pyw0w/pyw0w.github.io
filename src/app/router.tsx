import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { PageShell } from '../shared/ui/PageShell';

const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })));
const SearchPage = lazy(() => import('../features/search/SearchPage').then((module) => ({ default: module.SearchPage })));
const FavoritesPage = lazy(() => import('../features/favorites/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const HistoryPage = lazy(() => import('../features/history/HistoryPage').then((module) => ({ default: module.HistoryPage })));
const TitlePage = lazy(() => import('../features/title/TitlePage').then((module) => ({ default: module.TitlePage })));

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function RouteFallback() {
  return <PageShell title="Загрузка страницы" subtitle="Подготавливаем интерфейс…" isLoading />;
}

function renderLazyPage(PageComponent: ComponentType) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <PageComponent />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: renderLazyPage(HomePage),
      },
      {
        path: 'search',
        element: renderLazyPage(SearchPage),
      },
      {
        path: 'favorites',
        element: renderLazyPage(FavoritesPage),
      },
      {
        path: 'history',
        element: renderLazyPage(HistoryPage),
      },
      {
        path: 'title/:slug',
        element: renderLazyPage(TitlePage),
      },
    ],
  },
], { basename });
