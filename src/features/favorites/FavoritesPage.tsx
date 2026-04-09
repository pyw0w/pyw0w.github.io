import { Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
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
    >
      {titles.length > 0 ? (
        <TitleGrid titles={titles} />
      ) : (
        <Alert severity="info">Пока ничего не добавлено в избранное.</Alert>
      )}
    </PageShell>
  );
}
