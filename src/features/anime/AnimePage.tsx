import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnime } from '../../api/queries';
import { useKodikMatch } from './useKodikMatch';
import { workerApi } from '../../api/worker';
import { Player } from '../player/Player';
import { useProgress } from '../../store/progress';

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

  if (anime.isLoading) return <p>Загрузка…</p>;
  if (!anime.data) return <p>Тайтл не найден</p>;
  const a = anime.data;
  const episodesCount = match.data?.episodes ?? a.episodes ?? 1;

  return (
    <article>
      <h1>{a.russian ?? a.name}</h1>
      {match.data && (
        <div>
          <label>Озвучка:{' '}
            <select value={effectiveTranslation} onChange={(e) => setTranslation(e.target.value)}>
              {match.data.translations.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
              ))}
            </select>
          </label>
          <label> Серия:{' '}
            <select value={episode} onChange={(e) => setEpisode(Number(e.target.value))}>
              {Array.from({ length: episodesCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {stream.isError && <p>Не удалось получить поток. Попробуйте другую озвучку.</p>}
      {stream.data && (
        <Player
          manifest={stream.data.manifest}
          startAt={getPosition(id, episode)}
          onTime={(s) => setPosition(id, episode, s)}
        />
      )}
      <p>{a.description}</p>
    </article>
  );
}
