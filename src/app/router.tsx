import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '../features/home/HomePage';
import { SearchPage } from '../features/search/SearchPage';
import { FavoritesPage } from '../features/favorites/FavoritesPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { TitlePage } from '../features/title/TitlePage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'title/:slug',
        element: <TitlePage />,
      },
    ],
  },
], { basename });
