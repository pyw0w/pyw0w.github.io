import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stack } from '@mui/material';
import type { CatalogTitle } from '../../entities/catalog';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';
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
      banner={snapshotQuery.isError ? <EmptyState title="Не удалось загрузить snapshot истории" description="Сами записи истории сохранены локально, но без snapshot каталога сайт не может восстановить карточки тайтлов." severity="warning" /> : undefined}
    >
      <Stack spacing={3}>
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

        {snapshotQuery.data ? <CatalogFreshness generatedAt={snapshotQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
