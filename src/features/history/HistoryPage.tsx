import { Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { getCatalogSnapshot } from '../../shared/api/catalog';
import { getHistory } from '../../shared/storage/local';

export function HistoryPage() {
  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const historyIds = getHistory().map((item) => item.id);
  const titles = snapshotQuery.data?.items.filter((item) => historyIds.includes(item.id)) ?? [];

  return (
    <PageShell
      title="History"
      subtitle="Недавно открытые тайтлы, сохраненные локально в браузере."
      isLoading={snapshotQuery.isLoading}
    >
      {titles.length > 0 ? (
        <TitleGrid titles={titles} />
      ) : (
        <Alert severity="info">История пока пуста.</Alert>
      )}
    </PageShell>
  );
}
