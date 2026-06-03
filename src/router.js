import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(App, {}),
        children: [
            { index: true, element: _jsx(CatalogPage, {}) },
            { path: 'search', element: _jsx(SearchPage, {}) },
            { path: 'anime/:id', element: _jsx(AnimePage, {}) },
            { path: 'lists', element: _jsx(ListsPage, {}) },
            { path: 'login', element: _jsx(LoginPage, {}) },
            { path: 'oauth/callback', element: _jsx(CallbackPage, {}) },
        ],
    },
]);
