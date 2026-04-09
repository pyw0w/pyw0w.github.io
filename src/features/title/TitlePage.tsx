import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useParams } from 'react-router-dom';
import { getCatalogSnapshot, getPlaylist, getRelatedTitles, getTitleDetail } from '../../shared/api/catalog';
import { trackEvent } from '../../shared/analytics/events';
import { formatGenres, formatScore, sanitizeHtml } from '../../shared/lib/text';
import { getSelectedEpisode, isFavorite, pushHistory, setSelectedEpisode, toggleFavorite } from '../../shared/storage/local';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';
import { parseTitleRouteParam } from '../../shared/lib/routes';

export function TitlePage() {
  const params = useParams();
  const titleId = parseTitleRouteParam(params.slug);
  const [selectedEpisode, setSelectedEpisodeState] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });

  const detailQuery = useQuery({
    queryKey: ['title', titleId],
    queryFn: () => {
      if (!titleId) throw new Error('Invalid title route');
      return getTitleDetail(titleId);
    },
    enabled: Boolean(titleId),
  });

  const playlistQuery = useQuery({
    queryKey: ['playlist', titleId],
    queryFn: () => {
      if (!titleId) throw new Error('Invalid title route');
      return getPlaylist(titleId);
    },
    enabled: Boolean(titleId),
  });

  const relatedQuery = useQuery({
    queryKey: ['related', titleId],
    queryFn: () => {
      if (!detailQuery.data) throw new Error('Missing detail');
      return getRelatedTitles(detailQuery.data);
    },
    enabled: Boolean(detailQuery.data),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    pushHistory(detailQuery.data);
    setFavorite(isFavorite(detailQuery.data.id));
    trackEvent('title_open', { titleId: detailQuery.data.id, slug: detailQuery.data.slug });
  }, [detailQuery.data]);

  useEffect(() => {
    if (!playlistQuery.data || !detailQuery.data) return;
    const saved = getSelectedEpisode(detailQuery.data.id);
    const hasSavedEpisode = saved
      ? playlistQuery.data.some((episode) => episode.id === saved)
      : false;
    const fallback = playlistQuery.data[0]?.id ?? null;
    const nextEpisode = hasSavedEpisode ? saved : fallback;
    setSelectedEpisodeState(nextEpisode);

    if (!hasSavedEpisode && nextEpisode) {
      setSelectedEpisode(detailQuery.data.id, nextEpisode);
    }
  }, [detailQuery.data, playlistQuery.data]);

  const currentEpisode = useMemo(
    () => playlistQuery.data?.find((episode) => episode.id === selectedEpisode) ?? playlistQuery.data?.[0],
    [playlistQuery.data, selectedEpisode],
  );

  if (!titleId) {
    return (
      <PageShell title="Тайтл не найден">
        <Alert severity="error">Маршрут тайтла поврежден.</Alert>
      </PageShell>
    );
  }

  const isLoading = detailQuery.isLoading || playlistQuery.isLoading;
  const descriptionHtml = detailQuery.data ? sanitizeHtml(detailQuery.data.description) : '';

  return (
    <PageShell
      title={detailQuery.data?.title ?? 'Тайтл'}
      subtitle={detailQuery.data?.originalTitle || 'Страница просмотра с player + metadata above the fold.'}
      isLoading={isLoading}
      banner={
        detailQuery.isError ? (
          <Alert severity="error">Не удалось загрузить snapshot карточки тайтла. Проверьте каталог позже или откройте Search для перехода к другим релизам.</Alert>
        ) : playlistQuery.isError ? (
          <Alert severity="warning">Карточка тайтла доступна, но playlist сейчас не загрузился. Попробуйте обновить страницу позже.</Alert>
        ) : undefined
      }
    >
      <Stack spacing={3}>
      {detailQuery.data ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <Box sx={{ aspectRatio: '16 / 9', backgroundColor: 'common.black' }}>
                {currentEpisode ? (
                  <video
                    key={currentEpisode.id}
                    controls
                    playsInline
                    poster={currentEpisode.preview}
                    style={{ width: '100%', height: '100%' }}
                    onPlay={() =>
                      trackEvent('playback_start', {
                        titleId: detailQuery.data.id,
                        episodeId: currentEpisode.id,
                      })
                    }
                  >
                    <source src={currentEpisode.hd} type="video/mp4" />
                    <source src={currentEpisode.std} type="video/mp4" />
                  </video>
                ) : (
                  <Stack sx={{ width: '100%', height: '100%' }} alignItems="center" justifyContent="center">
                    {playlistQuery.isLoading ? <CircularProgress /> : <Alert severity="info">Видео пока недоступно.</Alert>}
                  </Stack>
                )}
              </Box>
            </Card>

            {playlistQuery.data && playlistQuery.data.length > 0 ? (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Эпизоды</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel id="episode-select-label">Эпизод</InputLabel>
                      <Select
                        labelId="episode-select-label"
                        label="Эпизод"
                        value={currentEpisode?.id ?? ''}
                        onChange={(event) => {
                          if (!detailQuery.data) return;
                          const value = event.target.value;
                          if (!value) return;
                          setSelectedEpisodeState(value);
                          setSelectedEpisode(detailQuery.data.id, value);
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 360,
                            },
                          },
                        }}
                      >
                        {playlistQuery.data.map((episode) => (
                          <MenuItem key={episode.id} value={episode.id}>
                            {episode.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      component="img"
                      src={detailQuery.data.poster}
                      alt={detailQuery.data.title}
                      sx={{ width: '100%', borderRadius: 4, aspectRatio: '57 / 75', objectFit: 'cover' }}
                    />
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={detailQuery.data.status} />
                      <Chip label={detailQuery.data.type} />
                      <Chip label={detailQuery.data.year} />
                      <Chip label={`★ ${formatScore(detailQuery.data.averageScore)}`} />
                    </Stack>
                    <Typography variant="h4">{detailQuery.data.title}</Typography>
                    {detailQuery.data.originalTitle ? (
                      <Typography color="text.secondary">{detailQuery.data.originalTitle}</Typography>
                    ) : null}
                    <Typography color="text.secondary">{formatGenres(detailQuery.data.genres)}</Typography>
                    {detailQuery.data.director ? (
                      <Typography color="text.secondary">Режиссер: {detailQuery.data.director}</Typography>
                    ) : null}
                    <Button
                      startIcon={favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      onClick={() => {
                        const next = toggleFavorite(detailQuery.data);
                        setFavorite(next);
                        trackEvent('favorite_toggle', { titleId: detailQuery.data.id, value: next });
                      }}
                    >
                      {favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Описание</Typography>
                    <Box dangerouslySetInnerHTML={{ __html: descriptionHtml }} sx={{ color: 'text.secondary', lineHeight: 1.7 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      ) : null}

      {relatedQuery.data && relatedQuery.data.length > 0 ? (
        <Stack spacing={2}>
          <Typography variant="h4">Похожие тайтлы</Typography>
          <TitleGrid titles={relatedQuery.data} />
        </Stack>
      ) : null}

      {snapshotQuery.data ? <CatalogFreshness generatedAt={snapshotQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
