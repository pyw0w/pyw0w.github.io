import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CatalogTitle } from '../../entities/catalog';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getCatalogSnapshot, getHomeFeed } from '../../shared/api/catalog';
import { getHistory, getTitleStorageIds } from '../../shared/storage/local';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';
import { titlePath } from '../../shared/lib/routes';
import { formatGenres, formatScore } from '../../shared/lib/text';

const HOME_HISTORY_LIMIT = 4;

export function HomePage() {
  const homeFeedQuery = useQuery({ queryKey: ['homeFeed'], queryFn: getHomeFeed });
  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const hero = homeFeedQuery.data?.hero;
  const latest = homeFeedQuery.data?.latest ?? [];
  const trending = homeFeedQuery.data?.trending ?? [];
  const recentHistory = useMemo(() => {
    if (!snapshotQuery.data) return [];
    const itemsById = new Map(
      snapshotQuery.data.items.flatMap((item) => getTitleStorageIds(item).map((id) => [id, item] as const)),
    );
    const seen = new Set<string>();
    return getHistory()
      .map((entry) => itemsById.get(entry.id))
      .filter((item): item is CatalogTitle => Boolean(item))
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, HOME_HISTORY_LIMIT);
  }, [snapshotQuery.data]);

  return (
    <PageShell
      title="Новинки и тренды"
      subtitle="Главный экран для быстрого discovery: свежие релизы, тренды и быстрый переход к просмотру."
      isLoading={homeFeedQuery.isLoading}
      banner={
        homeFeedQuery.isError ? (
          <Alert severity="warning">Не удалось собрать главную ленту из snapshot каталога. Попробуйте открыть Search или обновить страницу позже.</Alert>
        ) : undefined
      }
    >
      <Stack spacing={3}>
      {hero ? (
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 6,
            minHeight: { xs: 420, md: 460 },
            p: { xs: 3, md: 5 },
            display: 'flex',
            alignItems: 'flex-end',
            backgroundImage: `linear-gradient(180deg, rgba(8,10,16,0.12) 0%, rgba(8,10,16,0.82) 62%, rgba(8,10,16,0.96) 100%), url(${hero.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          }}
        >
          <Stack spacing={2.5} maxWidth={760}>
            <Typography variant="overline" sx={{ letterSpacing: 2.4, color: 'primary.light', fontWeight: 700 }}>
              Hero release
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={hero.status} color="primary" />
              <Chip label={hero.type} />
              <Chip label={hero.year} />
              <Chip label={`★ ${formatScore(hero.averageScore)}`} />
              <Chip label={hero.episodeLabel} />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h2">{hero.title}</Typography>
              {hero.originalTitle ? (
                <Typography variant="h6" color="grey.300">
                  {hero.originalTitle}
                </Typography>
              ) : null}
            </Stack>
            <Typography variant="body1" color="grey.100" sx={{ maxWidth: 680 }}>
              {hero.shortDescription}
            </Typography>
            <Typography color="grey.300">{formatGenres(hero.genres)}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={RouterLink} to={titlePath(hero)} size="large" variant="contained">
                Смотреть тайтл
              </Button>
              <Button component={RouterLink} to="/search" size="large" variant="outlined" color="inherit">
                Открыть каталог
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : homeFeedQuery.isLoading ? null : (
        <EmptyState
          title="Hero временно недоступен"
          description="Лента загрузилась не полностью. Откройте каталог, чтобы выбрать тайтл вручную, пока мы готовим следующий highlight."
          actionLabel="Перейти в Search"
          actionTo="/search"
        />
      )}

      <Stack spacing={2}>
        <Typography variant="h4">Новинки</Typography>
        {latest.length > 0 ? (
          <TitleGrid titles={latest} />
        ) : (
          <EmptyState title="Новинки скоро появятся" description="Снимок каталога обновится автоматически. Загляните позже или откройте полный каталог уже сейчас." actionLabel="Открыть каталог" actionTo="/search" />
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Тренды</Typography>
        {trending.length > 0 ? (
          <TitleGrid titles={trending} />
        ) : (
          <EmptyState title="Тренды пока не собраны" description="Сейчас не получилось собрать трендовые тайтлы. Попробуйте открыть каталог и выбрать сортировку вручную." actionLabel="Открыть каталог" actionTo="/search" />
        )}
      </Stack>

      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="h4">History</Typography>
          {recentHistory.length > 0 ? (
            <Button component={RouterLink} to="/history" size="small">
              Открыть всю историю
            </Button>
          ) : null}
        </Stack>
        {recentHistory.length > 0 ? (
          <TitleGrid titles={recentHistory} />
        ) : (
          <EmptyState
            title="История появится после первых просмотров"
            description="Откройте любой тайтл из Home или Search, и он сразу появится в этом блоке для быстрого возврата."
            actionLabel="Перейти в Search"
            actionTo="/search"
          />
        )}
      </Stack>

      {snapshotQuery.data ? <CatalogFreshness generatedAt={snapshotQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
