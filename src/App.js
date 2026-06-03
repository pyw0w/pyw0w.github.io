import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet } from 'react-router-dom';
export default function App() {
    return (_jsxs("div", { children: [_jsxs("nav", { children: [_jsx(Link, { to: "/", children: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433" }), " \u00B7 ", _jsx(Link, { to: "/search", children: "\u041F\u043E\u0438\u0441\u043A" }), " \u00B7", ' ', _jsx(Link, { to: "/lists", children: "\u0421\u043F\u0438\u0441\u043A\u0438" }), " \u00B7 ", _jsx(Link, { to: "/login", children: "\u0412\u0445\u043E\u0434" })] }), _jsx("main", { children: _jsx(Outlet, {}) })] }));
}
