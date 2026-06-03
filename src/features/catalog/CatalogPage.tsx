import { useCatalog } from '../../api/queries';
import { AnimeCard } from '../../components/AnimeCard';
import { PosterGridSkeleton } from '../../components/Skeleton';
import { ErrorMessage } from '../../components/ErrorMessage';

export default function CatalogPage() {
  const { data, isLoading, error, refetch } = useCatalog();

  if (isLoading) return <PosterGridSkeleton count={18} />;
  if (error || !data) return <ErrorMessage message="Не удалось загрузить каталог" retry={() => refetch()} />;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Каталог</h1>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {data.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
