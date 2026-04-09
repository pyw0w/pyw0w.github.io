import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CatalogTitle } from '../../entities/catalog';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { getCatalogSnapshot } from '../../shared/api/catalog';
import { getHistory } from '../../shared/storage/local';

export function HistoryPage() {
  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const history = getHistory();
  const titles = useMemo(() => {
    if (!snapshotQuery.data) return [];
    const itemsById = new Map(snapshotQuery.data.items.map((item) => [item.id, item]));
    return history.map((entry) => itemsById.get(entry.id)).filter((item): item is CatalogTitle => Boolean(item));
  }, [history, snapshotQuery.data]);

  return (
    <PageShell
      title="History"
      subtitle="Недавно открытые тайтлы, сохраненные локально в браузере."
      isLoading={snapshotQuery.isLoading}
      banner={snapshotQuery.isError ? <EmptyState title="Не удалось загрузить историю" description="Snapshot каталога временно недоступен. Попробуйте обновить страницу позже." severity="warning" /> : undefined}
    >
      {titles.length > 0 ? (
        <TitleGrid titles={titles} />
      ) : (
        <EmptyState
          title="История пока пуста"
          description="Откройте любой тайтл из Home или Search — после этого он появится в недавних просмотрах."
          actionLabel="Перейти в Search"
          actionTo="/search"
        />
      )}
    </PageShell>
  );
}
