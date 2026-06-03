import { Link } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';
import { Badge } from './Badge';
import type { ShikimoriAnime } from '../api/types';

interface AnimeCardProps {
  anime: ShikimoriAnime;
}

const kindLabels: Record<string, string> = {
  tv: 'TV',
  movie: 'Фильм',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Спешл',
  tv_special: 'TV Спешл',
  music: 'Клип',
};

export function AnimeCard({ anime }: AnimeCardProps) {
  const poster = anime.image.preview
    ? `https://shikimori.io${anime.image.preview}`
    : null;

  return (
    <Link
      to={`/anime/${anime.id}`}
      className="group block animate-in"
    >
      <div className="relative aspect-[3/4] rounded-card overflow-hidden bg-surface-2">
        {poster ? (
          <img
            src={poster}
            alt={anime.russian ?? anime.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            Нет постера
          </div>
        )}

        {/* Score overlay */}
        {anime.score && Number(anime.score) > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-base/80 backdrop-blur-sm rounded-pill px-1.5 py-0.5">
            <Star size={10} weight="fill" className="text-amber-400" />
            <span className="text-[10px] font-medium text-text-primary">{anime.score}</span>
          </div>
        )}
      </div>

      <div className="mt-1.5 px-0.5">
        <h3 className="text-[13px] font-medium leading-tight text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
          {anime.russian ?? anime.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          {anime.kind && (
            <Badge variant="muted">{kindLabels[anime.kind] ?? anime.kind}</Badge>
          )}
          {anime.episodes > 0 && (
            <span className="text-[11px] text-text-muted">{anime.episodes} эп.</span>
          )}
        </div>
      </div>
    </Link>
  );
}
