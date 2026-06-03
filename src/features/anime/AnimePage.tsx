import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, FilmSlate } from '@phosphor-icons/react';
import { useAnime } from '../../api/queries';
import { useKodikMatch } from './useKodikMatch';
import { workerApi } from '../../api/worker';
import { Player } from '../player/Player';
import { useProgress } from '../../store/progress';
import { Badge } from '../../components/Badge';
import { Skeleton } from '../../components/Skeleton';
import { ErrorMessage } from '../../components/ErrorMessage';

const kindLabels: Record<string, string> = {
  tv: 'TV Сериал', movie: 'Фильм', ova: 'OVA', ona: 'ONA',
  special: 'Спешл', tv_special: 'TV Спешл', music: 'Клип',
};

const statusLabels: Record<string, string> = {
  released: 'Вышел', ongoing: 'Онгоинг', anons: 'Анонс',
};

export default function AnimePage() {
  const { id = '' } = useParams();
  const anime = useAnime(id);
  const match = useKodikMatch(id);
  const [translation, setTranslation] = useState<string>('0');
  const [episode, setEpisode] = useState<number>(1);
  const { getPosition, setPosition } = useProgress();

  const effectiveTranslation = translation !== '0'
    ? translation
    : match.data?.translations[0]?.id ?? '0';

  const stream = useQuery({
    queryKey: ['stream', id, episode, effectiveTranslation],
    enabled: Boolean(match.data),
    queryFn: () => workerApi.stream({ id, episode, translation: effectiveTranslation }),
  });

  // Loading state
  if (anime.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-6 w-2/3 rounded-sm" />
        <Skeleton className="h-4 w-1/3 rounded-sm" />
        <Skeleton className="h-20 w-full rounded-sm" />
      </div>
    );
  }

  if (!anime.data) {
    return <ErrorMessage message="Тайтл не найден" />;
  }

  const a = anime.data;
  const poster = a.image.original ? `https://shikimori.io${a.image.original}` : null;
  const episodesCount = match.data?.episodes ?? a.episodes ?? 1;

  return (
    <article className="animate-in space-y-5">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Назад
      </Link>

      {/* Player or poster */}
      <div className="rounded-lg overflow-hidden bg-surface">
        {stream.data ? (
          <Player
            manifest={stream.data.manifest}
            startAt={getPosition(id, episode)}
            onTime={(s) => setPosition(id, episode, s)}
          />
        ) : stream.isError ? (
          <div className="aspect-video flex items-center justify-center bg-surface-2">
            <div className="text-center px-4">
              <FilmSlate size={32} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Не удалось получить поток</p>
              <p className="text-xs text-text-muted mt-1">Попробуйте другую озвучку</p>
            </div>
          </div>
        ) : stream.isFetching ? (
          <Skeleton className="aspect-video" />
        ) : poster ? (
          <img src={poster} alt={a.russian ?? a.name} className="w-full aspect-video object-cover" />
        ) : (
          <div className="aspect-video bg-surface-2" />
        )}
      </div>

      {/* Controls */}
      {match.data && (
        <div className="flex flex-wrap gap-2">
          <select
            value={effectiveTranslation}
            onChange={(e) => setTranslation(e.target.value)}
            className="flex-1 min-w-[160px]"
          >
            {match.data.translations.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
            ))}
          </select>
          <select
            value={episode}
            onChange={(e) => setEpisode(Number(e.target.value))}
            className="w-24"
          >
            {Array.from({ length: episodesCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Серия {n}</option>
            ))}
          </select>
        </div>
      )}

      {/* Info */}
      <div className="space-y-3">
        <h1 className="text-xl font-semibold leading-tight">{a.russian ?? a.name}</h1>

        {a.russian && a.name && a.russian !== a.name && (
          <p className="text-sm text-text-muted">{a.name}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {a.score && Number(a.score) > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} weight="fill" className="text-amber-400" />
              <span className="text-sm font-medium">{a.score}</span>
            </div>
          )}
          {a.kind && <Badge>{kindLabels[a.kind] ?? a.kind}</Badge>}
          {a.status && <Badge variant="accent">{statusLabels[a.status] ?? a.status}</Badge>}
          {a.episodes > 0 && <Badge variant="muted">{a.episodes} эп.</Badge>}
        </div>

        {a.description && (
          <p className="text-sm text-text-secondary leading-relaxed">{a.description}</p>
        )}
      </div>
    </article>
  );
}
