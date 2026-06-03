import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useCatalog } from '../../api/queries';
export default function CatalogPage() {
    const { data, isLoading, error } = useCatalog();
    if (isLoading)
        return _jsx("p", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" });
    if (error)
        return _jsx("p", { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430" });
    return (_jsx("ul", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, listStyle: 'none', padding: 0 }, children: data.map((a) => (_jsx("li", { children: _jsxs(Link, { to: `/anime/${a.id}`, children: [a.image.preview && _jsx("img", { src: `https://shikimori.io${a.image.preview}`, alt: "", style: { width: '100%' } }), _jsx("div", { children: a.russian ?? a.name })] }) }, a.id))) }));
}
