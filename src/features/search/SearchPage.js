import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../api/queries';
export default function SearchPage() {
    const [term, setTerm] = useState('');
    const { data, isFetching } = useSearch(term);
    return (_jsxs("div", { children: [_jsx("input", { value: term, onChange: (e) => setTerm(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u0430\u043D\u0438\u043C\u0435\u2026" }), isFetching && _jsx("span", { children: " \u2026" }), _jsx("ul", { children: (data ?? []).map((a) => (_jsx("li", { children: _jsx(Link, { to: `/anime/${a.id}`, children: a.russian ?? a.name }) }, a.id))) })] }));
}
