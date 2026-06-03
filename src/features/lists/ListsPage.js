import { jsx as _jsx } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { ensureAccessToken } from '../../auth/oauth';
import { shikimori } from '../../api/shikimori';
export default function ListsPage() {
    const { isAuthenticated } = useAuth();
    const rates = useQuery({
        queryKey: ['user-rates'],
        enabled: isAuthenticated,
        queryFn: async () => {
            const token = await ensureAccessToken();
            if (!token)
                throw new Error('no token');
            const me = await shikimori.whoami(token);
            return shikimori.userRates(token, { user_id: me.id, status: 'watching', limit: 50 });
        },
    });
    if (!isAuthenticated)
        return _jsx("p", { children: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 Shikimori, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0441\u043F\u0438\u0441\u043A\u0438." });
    if (rates.isLoading)
        return _jsx("p", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043F\u0438\u0441\u043A\u043E\u0432\u2026" });
    if (rates.isError)
        return _jsx("p", { children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043A\u0438" });
    return _jsx("pre", { children: JSON.stringify(rates.data, null, 2) });
}
