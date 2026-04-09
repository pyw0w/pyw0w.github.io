import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useParams } from 'react-router-dom';
import { getPlaylist, getRelatedTitles, getTitleDetail } from '../../shared/api/catalog';
import { trackEvent } from '../../shared/analytics/events';
import { formatGenres, formatScore, sanitizeHtml } from '../../shared/lib/text';
import { getSelectedEpisode, isFavorite, pushHistory, setSelectedEpisode, toggleFavorite } from '../../shared/storage/local';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { parseTitleRouteParam } from '../../shared/lib/routes';

export function TitlePage() {
  const params = useParams();
  const titleId = parseTitleRouteParam(params.slug);
  const [selectedEpisode, setSelectedEpisodeState] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

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
    const fallback = playlistQuery.data[0]?.id ?? null;
    setSelectedEpisodeState(saved ?? fallback);
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
  const descriptionHtml = detailQuery.data
    ? DOMPurify.sanitize(sanitizeHtml(detailQuery.data.description), {
        ALLOWED_TAGS: ['br', 'p', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
      })
    : '';

  return (
    <PageShell
      title={detailQuery.data?.title ?? 'Тайтл'}
      subtitle={detailQuery.data?.originalTitle || 'Страница просмотра с player + metadata above the fold.'}
      isLoading={isLoading}
      banner={
        detailQuery.isError ? (
          <Alert severity="error">Не удалось загрузить страницу тайтла.</Alert>
        ) : playlistQuery.isError ? (
          <Alert severity="warning">Описание доступно, но playlist сейчас не загрузился.</Alert>
        ) : undefined
      }
    >
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
                    <ToggleButtonGroup
                      color="primary"
                      value={selectedEpisode}
                      exclusive
                      onChange={(_event, value) => {
                        if (!value || !detailQuery.data) return;
                        setSelectedEpisodeState(value);
                        setSelectedEpisode(detailQuery.data.id, value);
                      }}
                      sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}
                    >
                      {playlistQuery.data.map((episode) => (
                        <ToggleButton key={episode.id} value={episode.id} sx={{ borderRadius: 999 }}>
                          {episode.name}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
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
    </PageShell>
  );
}
