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
import type { CatalogSourceId } from '../../entities/catalog';
import { getCatalogSnapshot, getPlaylist, getRelatedTitles, getTitleDetail, resolveTitleRoute } from '../../shared/api/catalog';
import { trackEvent } from '../../shared/analytics/events';
import { formatGenres, formatScore, sanitizeHtml } from '../../shared/lib/text';
import {
  getPreferredSourceId,
  getSelectedEpisode,
  getTitleStorageIds,
  pushHistory,
  setPreferredSourceId,
  setSelectedEpisode,
  toggleFavorite,
  useFavorites,
} from '../../shared/storage/local';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';

const TRUSTED_EMBED_HOSTS = new Set(['isekai.anidub.fun', 'player.ladonyvesna2005.info']);

function getSourceLabel(sourceId: CatalogSourceId): string {
  return sourceId === 'anidub' ? 'AniDub' : 'AnimeTop';
}

function getTrustedEmbedUrl(url: string | undefined): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '';
    if (!TRUSTED_EMBED_HOSTS.has(parsed.host)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export function TitlePage() {
  const params = useParams();
  const [selectedEpisode, setSelectedEpisodeState] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceIdState] = useState<CatalogSourceId | null>(null);
  const favorites = useFavorites();

  const snapshotQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const routeQuery = useQuery({
    queryKey: ['titleRoute', params.sourceId ?? '', params.slug ?? ''],
    queryFn: () => resolveTitleRoute(params.sourceId, params.slug),
  });

  const title = routeQuery.data?.title ?? null;
  const titleId = title?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ['title', titleId, selectedSourceId],
    queryFn: () => {
      if (!titleId || !selectedSourceId) throw new Error('Invalid title route');
      return getTitleDetail(titleId, selectedSourceId);
    },
    enabled: Boolean(titleId && selectedSourceId),
  });

  const playlistQuery = useQuery({
    queryKey: ['playlist', titleId, selectedSourceId],
    queryFn: () => {
      if (!titleId || !selectedSourceId) throw new Error('Invalid title route');
      return getPlaylist(titleId, selectedSourceId);
    },
    enabled: Boolean(titleId && selectedSourceId),
  });

  const relatedQuery = useQuery({
    queryKey: ['related', titleId],
    queryFn: () => {
      if (!title) throw new Error('Missing title');
      return getRelatedTitles(title);
    },
    enabled: Boolean(title),
  });

  const favorite = useMemo(() => {
    if (!title) return false;
    const ids = new Set(getTitleStorageIds(title));
    return favorites.some((item) => ids.has(item.id));
  }, [favorites, title]);

  useEffect(() => {
    if (!title) return;
    pushHistory(title);
  }, [title?.id]);

  useEffect(() => {
    if (!title) return;

    const requestedSourceId = routeQuery.data?.preferredSourceId
      ?? getPreferredSourceId(title.id)
      ?? title.primarySourceId
      ?? title.sources[0]?.sourceId
      ?? null;
    const nextSourceId = requestedSourceId && title.sources.some((source) => source.sourceId === requestedSourceId)
      ? requestedSourceId
      : title.primarySourceId ?? title.sources[0]?.sourceId ?? null;

    setSelectedSourceIdState(nextSourceId);
    setSelectedEpisodeState(null);
  }, [routeQuery.data?.preferredSourceId, title?.id]);

  useEffect(() => {
    if (!title || !selectedSourceId) return;
    setPreferredSourceId(title.id, selectedSourceId);
    trackEvent('title_open', { titleId: title.id, slug: title.slug, sourceId: selectedSourceId });
  }, [selectedSourceId, title?.id, title?.slug]);

  useEffect(() => {
    if (!playlistQuery.data || !detailQuery.data || !selectedSourceId) return;

    if (selectedSourceId === 'anidub') {
      setSelectedEpisodeState(playlistQuery.data[0]?.id ?? null);
      return;
    }

    const currentSource = detailQuery.data.sources.find((source) => source.sourceId === selectedSourceId);
    const saved = getSelectedEpisode(detailQuery.data.id, selectedSourceId, currentSource?.legacyTitleId);
    const hasSavedEpisode = saved
      ? playlistQuery.data.some((episode) => episode.id === saved)
      : false;
    const fallback = playlistQuery.data[0]?.id ?? null;
    const nextEpisode = hasSavedEpisode ? saved : fallback;
    setSelectedEpisodeState(nextEpisode);

    if (!hasSavedEpisode && nextEpisode) {
      setSelectedEpisode(detailQuery.data.id, selectedSourceId, nextEpisode);
    }
  }, [detailQuery.data?.id, playlistQuery.data, selectedSourceId]);

  const currentEpisode = useMemo(
    () => playlistQuery.data?.find((episode) => episode.id === selectedEpisode) ?? playlistQuery.data?.[0],
    [playlistQuery.data, selectedEpisode],
  );
  const currentEpisodeIndex = useMemo(
    () => (currentEpisode && playlistQuery.data
      ? playlistQuery.data.findIndex((episode) => episode.id === currentEpisode.id)
      : -1),
    [currentEpisode, playlistQuery.data],
  );
  const previousEpisode = currentEpisodeIndex > 0 ? playlistQuery.data?.[currentEpisodeIndex - 1] ?? null : null;
  const nextEpisode = currentEpisodeIndex >= 0 ? playlistQuery.data?.[currentEpisodeIndex + 1] ?? null : null;
  const rawPlayerUrl = currentEpisode?.playerUrl ?? detailQuery.data?.playerUrl ?? '';
  const currentPlayerUrl = getTrustedEmbedUrl(rawPlayerUrl);
  const hasUnsafePlayerUrl = Boolean(rawPlayerUrl) && !currentPlayerUrl;
  const playbackUnsupported = Boolean(currentEpisode?.playbackUnsupported || detailQuery.data?.playbackUnsupported || hasUnsafePlayerUrl);
  const playbackMessage = currentEpisode?.playbackMessage
    || detailQuery.data?.playbackMessage
    || (hasUnsafePlayerUrl
      ? 'Источник вернул неподдерживаемую ссылку для встроенного плеера, поэтому playback отключён.'
      : 'Видео пока недоступно.');

  function selectEpisode(episodeId: string) {
    if (!detailQuery.data || !selectedSourceId || selectedSourceId === 'anidub') return;
    setSelectedEpisodeState(episodeId);
    setSelectedEpisode(detailQuery.data.id, selectedSourceId, episodeId);
  }

  if (routeQuery.isError) {
    return (
      <PageShell title="Тайтл недоступен">
        <Alert severity="error">Не удалось разобрать маршрут тайтла. Попробуйте открыть карточку заново из каталога.</Alert>
      </PageShell>
    );
  }

  if (!routeQuery.isLoading && !title) {
    return (
      <PageShell title="Тайтл не найден">
        <Alert severity="error">Тайтл не найден или маршрут повреждён.</Alert>
      </PageShell>
    );
  }

  const isLoading = routeQuery.isLoading || (Boolean(titleId && selectedSourceId) && (detailQuery.isLoading || playlistQuery.isLoading));
  const descriptionHtml = useMemo(
    () => (detailQuery.data ? sanitizeHtml(detailQuery.data.description) : ''),
    [detailQuery.data?.description],
  );
  const metadataItems = detailQuery.data ? [
    { label: 'Эпизоды', value: detailQuery.data.episodeLabel || '—' },
    { label: 'Жанры', value: formatGenres(detailQuery.data.genres) || '—' },
    { label: 'Режиссёр', value: detailQuery.data.director || '—' },
  ] : [];

  return (
    <PageShell
      title={detailQuery.data?.title ?? title?.title ?? 'Тайтл'}
      subtitle={detailQuery.data?.originalTitle || title?.originalTitle || 'Страница просмотра тайтла.'}
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
                  {playbackUnsupported ? (
                    <Stack sx={{ width: '100%', height: '100%', p: 2 }} alignItems="center" justifyContent="center">
                      <Alert severity="info">{playbackMessage}</Alert>
                    </Stack>
                  ) : currentPlayerUrl ? (
                    <Box
                      component="iframe"
                      src={currentPlayerUrl}
                      title={`${detailQuery.data.title} player`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      sx={{ width: '100%', height: '100%', border: 0 }}
                    />
                  ) : currentEpisode ? (
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
                          sourceId: detailQuery.data.selectedSourceId,
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

              {detailQuery.data.sources.length > 1 ? (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Источник</Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id="source-select-label">Плеер</InputLabel>
                        <Select
                          labelId="source-select-label"
                          label="Плеер"
                          value={selectedSourceId ?? ''}
                          onChange={(event) => {
                            const nextSourceId = event.target.value as CatalogSourceId;
                            setSelectedSourceIdState(nextSourceId);
                            setSelectedEpisodeState(null);
                          }}
                        >
                          {detailQuery.data.sources.map((source) => (
                            <MenuItem key={source.sourceId} value={source.sourceId}>
                              {getSourceLabel(source.sourceId)}{source.episodeLabel ? ` — ${source.episodeLabel}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {detailQuery.data.selectedSourceId === 'anidub' && currentPlayerUrl ? (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Переключение серий для AniDub доступно внутри встроенного плеера.
                </Alert>
              ) : null}

              {playlistQuery.data && playlistQuery.data.length > 0 && detailQuery.data.selectedSourceId !== 'anidub' ? (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Эпизоды</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="episode-select-label">Эпизод</InputLabel>
                          <Select
                            labelId="episode-select-label"
                            label="Эпизод"
                            value={currentEpisode?.id ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (!value) return;
                              selectEpisode(value);
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

                        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                          <Button
                            variant="outlined"
                            disabled={!previousEpisode}
                            onClick={() => {
                              if (!previousEpisode) return;
                              selectEpisode(previousEpisode.id);
                            }}
                            sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
                          >
                            Назад
                          </Button>
                          <Button
                            variant="outlined"
                            disabled={!nextEpisode}
                            onClick={() => {
                              if (!nextEpisode) return;
                              selectEpisode(nextEpisode.id);
                            }}
                            sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
                          >
                            Далее
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Box
                        component="img"
                        src={detailQuery.data.poster}
                        alt={detailQuery.data.title}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          const target = event.currentTarget as HTMLImageElement;
                          target.style.visibility = 'hidden';
                        }}
                        sx={{ width: '100%', borderRadius: 4, aspectRatio: '57 / 75', objectFit: 'cover', backgroundColor: 'background.paper' }}
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={detailQuery.data.status} />
                        <Chip label={detailQuery.data.type} />
                        <Chip label={detailQuery.data.year} />
                        {detailQuery.data.sources.map((source) => (
                          <Chip
                            key={source.sourceId}
                            label={getSourceLabel(source.sourceId)}
                            variant={source.sourceId === detailQuery.data.selectedSourceId ? 'filled' : 'outlined'}
                          />
                        ))}
                        <Chip label={`★ ${formatScore(detailQuery.data.averageScore)}`} />
                      </Stack>
                      <Stack spacing={0.75}>
                        <Typography variant="h4">{detailQuery.data.title}</Typography>
                        {detailQuery.data.originalTitle ? (
                          <Typography color="text.secondary">{detailQuery.data.originalTitle}</Typography>
                        ) : null}
                      </Stack>
                      <Stack spacing={1.25}>
                        {metadataItems.map((item) => (
                          <Stack key={item.label} direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 96 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="body2" sx={{ textAlign: 'right', flex: 1 }}>
                              {item.value}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Button
                        startIcon={favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        onClick={() => {
                          if (!detailQuery.data) return;
                          const next = toggleFavorite(detailQuery.data);
                          trackEvent('favorite_toggle', { titleId: detailQuery.data.id, value: next, sourceId: detailQuery.data.selectedSourceId });
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
            <Typography variant="h4" component="h2">Похожие тайтлы</Typography>
            <TitleGrid titles={relatedQuery.data} />
          </Stack>
        ) : null}

        {snapshotQuery.data ? <CatalogFreshness generatedAt={snapshotQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
