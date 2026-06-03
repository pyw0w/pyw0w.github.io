import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workerApi } from '../../api/worker';
import { useAuth } from '../../auth/AuthContext';
export default function CallbackPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState(null);
    const ran = useRef(false);
    useEffect(() => {
        if (ran.current)
            return;
        ran.current = true;
        const code = params.get('code');
        if (!code) {
            setError('Нет кода авторизации');
            return;
        }
        workerApi.exchangeOAuthCode(code)
            .then((t) => { login(t); navigate('/lists', { replace: true }); })
            .catch((e) => setError(String(e.message ?? e)));
    }, [params, login, navigate]);
    return _jsx("div", { children: error ? `Ошибка входа: ${error}` : 'Входим…' });
}
