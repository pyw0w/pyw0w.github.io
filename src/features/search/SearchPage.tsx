import { useState } from 'react';
import { useSearch } from '../../api/queries';
import { AnimeCard } from '../../components/AnimeCard';
import { SearchInput } from '../../components/SearchInput';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PosterGridSkeleton } from '../../components/Skeleton';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function SearchPage() {
  const [term, setTerm] = useState('');
  const { data, isFetching, error, refetch } = useSearch(term);
  const hasQuery = term.trim().length > 1;

  return (
    <div className="space-y-4">
      <SearchInput value={term} onChange={setTerm} isLoading={isFetching} />

      {!hasQuery && (
        <EmptyState
          icon={<MagnifyingGlass size={32} />}
          title="Найди свой тайтл"
          description="Введите название аниме для поиска"
        />
      )}

      {hasQuery && isFetching && !data && <PosterGridSkeleton count={8} />}

      {error && <ErrorMessage message="Ошибка поиска" retry={() => refetch()} />}

      {hasQuery && data && data.length === 0 && (
        <EmptyState title="Ничего не найдено" description="Попробуйте другой запрос" />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {data.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}
