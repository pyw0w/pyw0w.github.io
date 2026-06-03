import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListBullets, SignIn } from '@phosphor-icons/react';
import { useAuth } from '../../auth/AuthContext';
import { ensureAccessToken } from '../../auth/oauth';
import { shikimori } from '../../api/shikimori';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Skeleton } from '../../components/Skeleton';
import { Badge } from '../../components/Badge';

interface UserRate {
  id: number;
  target_id: number;
  target_type: string;
  score: number;
  status: string;
  episodes: number;
  anime?: {
    id: number;
    name: string;
    russian: string | null;
    image: { preview: string | null };
    episodes: number;
    kind: string | null;
  };
}

const statusLabels: Record<string, string> = {
  watching: 'Смотрю',
  planned: 'Запланировано',
  completed: 'Просмотрено',
  rewatching: 'Пересматриваю',
  on_hold: 'Отложено',
  dropped: 'Брошено',
};

export default function ListsPage() {
  const { isAuthenticated } = useAuth();

  const rates = useQuery({
    queryKey: ['user-rates'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await ensureAccessToken();
      if (!token) throw new Error('no token');
      const me = await shikimori.whoami(token);
      return shikimori.userRates(token, { user_id: me.id, status: 'watching', limit: 50 }) as Promise<UserRate[]>;
    },
  });

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<SignIn size={32} />}
        title="Войдите в аккаунт"
        description="Авторизуйтесь через Shikimori, чтобы увидеть ваши списки"
        action={
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-base rounded-pill text-sm font-medium hover:bg-accent-hover transition-colors active:scale-[0.97]"
          >
            Войти
          </Link>
        }
      />
    );
  }

  if (rates.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-12 h-16 rounded-sm shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3.5 w-3/4 rounded-sm" />
              <Skeleton className="h-3 w-1/3 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rates.isError) {
    return <ErrorMessage message="Не удалось загрузить списки" retry={() => rates.refetch()} />;
  }

  if (!rates.data || rates.data.length === 0) {
    return (
      <EmptyState
        icon={<ListBullets size={32} />}
        title="Список пуст"
        description="Добавьте аниме в список 'Смотрю' на Shikimori"
      />
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Смотрю</h1>
      <div className="space-y-2">
        {rates.data.map((rate) => {
          const anime = rate.anime;
          const poster = anime?.image?.preview
            ? `https://shikimori.io${anime.image.preview}`
            : null;

          return (
            <Link
              key={rate.id}
              to={`/anime/${rate.target_id}`}
              className="flex gap-3 p-2 rounded-card hover:bg-surface-2 transition-colors animate-in group"
            >
              <div className="w-12 h-16 rounded-sm overflow-hidden bg-surface-2 shrink-0">
                {poster && (
                  <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <h3 className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                  {anime?.russian ?? anime?.name ?? `Anime #${rate.target_id}`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {anime?.episodes && anime.episodes > 0 && (
                    <span className="text-xs text-text-muted">
                      {rate.episodes}/{anime.episodes} эп.
                    </span>
                  )}
                  {rate.score > 0 && (
                    <Badge variant="accent">{rate.score}</Badge>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
