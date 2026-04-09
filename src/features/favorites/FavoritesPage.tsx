import { useQuery } from '@tanstack/react-query';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { getCatalogSnapshot } from '../../shared/api/catalog';
import { getFavorites } from '../../shared/storage/local';

export function FavoritesPage() {
  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const favoriteIds = getFavorites().map((item) => item.id);
  const titles = snapshotQuery.data?.items.filter((item) => favoriteIds.includes(item.id)) ?? [];

  return (
    <PageShell
      title="Favorites"
      subtitle="Локальное избранное без аккаунтов, с возможностью потом заменить storage на синхронизируемый слой."
      isLoading={snapshotQuery.isLoading}
      banner={snapshotQuery.isError ? <EmptyState title="Не удалось загрузить избранное" description="Каталог временно недоступен. Попробуйте обновить страницу позже." severity="warning" /> : undefined}
    >
      {titles.length > 0 ? (
        <TitleGrid titles={titles} />
      ) : (
        <EmptyState
          title="Избранное пока пусто"
          description="Откройте тайтл и добавьте его в избранное, чтобы быстро возвращаться к любимым релизам."
          actionLabel="Открыть каталог"
          actionTo="/search"
        />
      )}
    </PageShell>
  );
}
