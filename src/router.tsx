import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import CatalogPage from './features/catalog/CatalogPage';
import SearchPage from './features/search/SearchPage';
import AnimePage from './features/anime/AnimePage';
import ListsPage from './features/lists/ListsPage';
import LoginPage from './features/auth/LoginPage';
import CallbackPage from './features/auth/CallbackPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'anime/:id', element: <AnimePage /> },
      { path: 'lists', element: <ListsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'oauth/callback', element: <CallbackPage /> },
    ],
  },
]);
