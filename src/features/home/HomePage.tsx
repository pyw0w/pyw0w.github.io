import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getLatestTitles, getTrendingTitles } from '../../shared/api/catalog';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { titlePath } from '../../shared/lib/routes';

export function HomePage() {
  const latestQuery = useQuery({ queryKey: ['latest', 12], queryFn: () => getLatestTitles(12) });
  const trendingQuery = useQuery({ queryKey: ['trending', 12], queryFn: () => getTrendingTitles(12) });
  const hero = latestQuery.data?.[0];

  return (
    <PageShell
      title="Новинки и тренды"
      subtitle="Главный экран для быстрого discovery: свежие релизы, тренды и быстрый переход к просмотру."
      isLoading={latestQuery.isLoading || trendingQuery.isLoading}
      banner={
        latestQuery.isError || trendingQuery.isError ? (
          <Alert severity="warning">Не удалось обновить ленту. Попробуйте перезагрузить страницу.</Alert>
        ) : undefined
      }
    >
      {hero ? (
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 6,
            p: { xs: 3, md: 5 },
            minHeight: 360,
            display: 'flex',
            alignItems: 'flex-end',
            backgroundImage: `linear-gradient(180deg, rgba(9,11,16,0.18) 0%, rgba(9,11,16,0.9) 100%), url(${hero.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          <Stack spacing={2} maxWidth={720}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label="Hero" color="primary" />
              <Chip label={hero.status} />
              <Chip label={hero.type} />
              <Chip label={hero.year} />
            </Stack>
            <Typography variant="h2">{hero.title}</Typography>
            <Typography variant="body1" color="grey.100">
              {hero.shortDescription}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={RouterLink} to={titlePath(hero)} size="large">
                Смотреть тайтл
              </Button>
              <Button component={RouterLink} to="/search" size="large" variant="outlined">
                Открыть каталог
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <Stack spacing={2}>
        <Typography variant="h4">Новинки</Typography>
        <TitleGrid titles={latestQuery.data ?? []} />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Тренды</Typography>
        <TitleGrid titles={trendingQuery.data ?? []} />
      </Stack>
    </PageShell>
  );
}
