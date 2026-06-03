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
      if (!token) throw new Error('no token');
      const me = await shikimori.whoami(token);
      return shikimori.userRates(token, { user_id: me.id, status: 'watching', limit: 50 });
    },
  });

  if (!isAuthenticated) return <p>Войдите через Shikimori, чтобы увидеть списки.</p>;
  if (rates.isLoading) return <p>Загрузка списков…</p>;
  if (rates.isError) return <p>Не удалось загрузить списки</p>;
  return <pre>{JSON.stringify(rates.data, null, 2)}</pre>;
}
