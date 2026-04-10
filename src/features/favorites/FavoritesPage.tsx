import { useQuery } from '@tanstack/react-query';
import { Stack } from '@mui/material';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';
import { getCatalogSnapshot } from '../../shared/api/catalog';
import { getFavorites, matchesStoredTitleIds } from '../../shared/storage/local';

export function FavoritesPage() {
  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const favoriteIds = new Set(getFavorites().map((item) => item.id));
  const titles = snapshotQuery.data?.items.filter((item) => matchesStoredTitleIds(item, favoriteIds)) ?? [];

  return (
    <PageShell
      title="Favorites"
      subtitle="Локальное избранное без аккаунтов, с возможностью потом заменить storage на синхронизируемый слой."
      isLoading={snapshotQuery.isLoading}
      banner={snapshotQuery.isError ? <EmptyState title="Не удалось загрузить snapshot избранного" description="Избранное сохранено локально, но без snapshot каталога сайт не может показать актуальные карточки тайтлов." severity="warning" /> : undefined}
    >
      <Stack spacing={3}>
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

        {snapshotQuery.data ? <CatalogFreshness generatedAt={snapshotQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
