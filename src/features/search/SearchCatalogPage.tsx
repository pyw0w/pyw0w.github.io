import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import { useSearchParams } from 'react-router-dom';
import type { CatalogParams } from '../../entities/catalog';
import { getCatalogResults, getCatalogSnapshot } from '../../shared/api/catalog';
import { trackEvent } from '../../shared/analytics/events';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';

const DEFAULT_CATALOG_PARAMS: CatalogParams = {
  page: 1,
  search: '',
  genre: '',
  status: '',
  year: '',
  type: '',
  sort: 'latest',
};

function buildCatalogSearchParams(params: CatalogParams): URLSearchParams {
  const nextSearch = new URLSearchParams();
  if (params.search) nextSearch.set('q', params.search);
  if (params.genre) nextSearch.set('genre', params.genre);
  if (params.status) nextSearch.set('status', params.status);
  if (params.year) nextSearch.set('year', params.year);
  if (params.type) nextSearch.set('type', params.type);
  if (params.sort !== 'latest') nextSearch.set('sort', params.sort);
  if (params.page > 1) nextSearch.set('page', String(params.page));
  return nextSearch;
}

function useCatalogParams(): [CatalogParams, (patch: Partial<CatalogParams>) => void, (next: CatalogParams) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: CatalogParams = {
    page: Number.parseInt(searchParams.get('page') ?? '1', 10) || 1,
    search: searchParams.get('q') ?? '',
    genre: searchParams.get('genre') ?? '',
    status: searchParams.get('status') ?? '',
    year: searchParams.get('year') ?? '',
    type: searchParams.get('type') ?? '',
    sort: (searchParams.get('sort') as CatalogParams['sort']) || 'latest',
  };

  function apply(next: CatalogParams) {
    setSearchParams(buildCatalogSearchParams(next), { replace: true });
    trackEvent('filter_change', { ...next });
  }

  function update(nextPatch: Partial<CatalogParams>) {
    apply({ ...params, ...nextPatch });
  }

  return [params, update, apply];
}

interface FilterControlsProps {
  params: CatalogParams;
  updateParams: (patch: Partial<CatalogParams>) => void;
  genres: string[];
  years: string[];
  types: string[];
  statuses: string[];
}

interface AppliedFilterChip {
  key: keyof CatalogParams;
  label: string;
}

function getActiveFiltersCount(params: CatalogParams): number {
  return [params.search, params.genre, params.status, params.year, params.type, params.sort !== 'latest' ? params.sort : '']
    .filter(Boolean)
    .length;
}

function getAppliedFilterChips(params: CatalogParams): AppliedFilterChip[] {
  return [
    params.search ? { key: 'search', label: `Поиск: ${params.search}` } : null,
    params.genre ? { key: 'genre', label: `Жанр: ${params.genre}` } : null,
    params.status ? { key: 'status', label: `Статус: ${params.status}` } : null,
    params.year ? { key: 'year', label: `Год: ${params.year}` } : null,
    params.type ? { key: 'type', label: `Тип: ${params.type}` } : null,
    params.sort !== 'latest' ? { key: 'sort', label: params.sort === 'trending' ? 'Сортировка: Тренд' : 'Сортировка: Рейтинг' } : null,
  ].filter((value): value is AppliedFilterChip => Boolean(value));
}

function FilterControls({ params, updateParams, genres, years, types, statuses }: FilterControlsProps) {
  return (
    <Stack spacing={2.5} sx={{ p: { xs: 0, md: 0 } }}>
      <TextField
        label="Поиск"
        value={params.search}
        onChange={(event) => updateParams({ search: event.target.value, page: 1 })}
        placeholder="Название, жанр или оригинальное имя"
        fullWidth
      />

      <FormControl fullWidth>
        <InputLabel id="genre-label">Жанр</InputLabel>
        <Select
          labelId="genre-label"
          label="Жанр"
          value={params.genre}
          onChange={(event) => updateParams({ genre: event.target.value, page: 1 })}
        >
          <MenuItem value="">Все жанры</MenuItem>
          {genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="status-label">Статус</InputLabel>
        <Select
          labelId="status-label"
          label="Статус"
          value={params.status}
          onChange={(event) => updateParams({ status: event.target.value, page: 1 })}
        >
          <MenuItem value="">Все статусы</MenuItem>
          {statuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="year-label">Год</InputLabel>
        <Select
          labelId="year-label"
          label="Год"
          value={params.year}
          onChange={(event) => updateParams({ year: event.target.value, page: 1 })}
        >
          <MenuItem value="">Все годы</MenuItem>
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="type-label">Тип</InputLabel>
        <Select
          labelId="type-label"
          label="Тип"
          value={params.type}
          onChange={(event) => updateParams({ type: event.target.value, page: 1 })}
        >
          <MenuItem value="">Все типы</MenuItem>
          {types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="sort-label">Сортировка</InputLabel>
        <Select
          labelId="sort-label"
          label="Сортировка"
          value={params.sort}
          onChange={(event) => updateParams({ sort: event.target.value as CatalogParams['sort'], page: 1 })}
        >
          <MenuItem value="latest">По новизне</MenuItem>
          <MenuItem value="trending">По тренду</MenuItem>
          <MenuItem value="rating">По рейтингу</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}

interface SearchCatalogPageProps {
  title?: string;
  subtitle?: string;
  emptyState?: ReactNode;
}

export function SearchCatalogPage({
  title = 'Search',
  subtitle = 'Единый каталог со стабильными фильтрами, сортировкой и URL-параметрами.',
  emptyState,
}: SearchCatalogPageProps) {
  const [params, updateParams, applyParams] = useCatalogParams();
  const filtersQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const resultsQuery = useQuery({ queryKey: ['catalog', params], queryFn: () => getCatalogResults(params) });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftParams, setDraftParams] = useState<CatalogParams>(params);

  useEffect(() => {
    if (!mobileOpen) return;
    setDraftParams(params);
  }, [mobileOpen, params]);

  const filters = filtersQuery.data?.filters;
  const activeFiltersCount = useMemo(() => getActiveFiltersCount(params), [params]);
  const appliedFilterChips = useMemo(() => getAppliedFilterChips(params), [params]);

  function updateDraftParams(patch: Partial<CatalogParams>) {
    setDraftParams((current) => ({ ...current, ...patch }));
  }

  function resetDraftParams() {
    setDraftParams(DEFAULT_CATALOG_PARAMS);
  }

  function applyDraftParams() {
    applyParams({ ...draftParams, page: 1 });
    setMobileOpen(false);
  }

  function clearAppliedFilter(key: keyof CatalogParams) {
    const next = { ...params, [key]: DEFAULT_CATALOG_PARAMS[key], page: 1 } as CatalogParams;
    updateParams(next);
  }

  function clearAllAppliedFilters() {
    applyParams(DEFAULT_CATALOG_PARAMS);
  }

  const desktopFilters = filters ? (
    <Box sx={{ width: { xs: 320, md: 'auto' }, p: { xs: 2.5, md: 0 } }}>
      <FilterControls
        params={params}
        updateParams={(patch) => updateParams({ ...patch, page: 1 })}
        genres={filters.genres}
        years={filters.years}
        types={filters.types}
        statuses={filters.statuses}
      />
    </Box>
  ) : null;

  const mobileDrawerContent = filters ? (
    <Box sx={{ width: 340, maxWidth: '100vw', p: 2.5, display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Stack spacing={1}>
        <Typography variant="h6">Фильтры</Typography>
        <Typography color="text.secondary">
          Активно: {getActiveFiltersCount(draftParams)}
        </Typography>
      </Stack>

      <FilterControls
        params={draftParams}
        updateParams={(patch) => updateDraftParams({ ...patch, page: 1 })}
        genres={filters.genres}
        years={filters.years}
        types={filters.types}
        statuses={filters.statuses}
      />

      <Stack direction="row" spacing={1.5} sx={{ mt: 'auto' }}>
        <Button fullWidth variant="outlined" onClick={resetDraftParams}>
          Сбросить
        </Button>
        <Button fullWidth variant="contained" onClick={applyDraftParams}>
          Показать результаты
        </Button>
      </Stack>
    </Box>
  ) : null;

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      isLoading={filtersQuery.isLoading || resultsQuery.isLoading}
      banner={resultsQuery.isError ? <Alert severity="warning">Каталог временно недоступен.</Alert> : undefined}
    >
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          {desktopFilters}
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
              <Typography color="text.secondary">
                Найдено: {resultsQuery.data?.total ?? 0}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<TuneIcon />}
                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                onClick={() => setMobileOpen(true)}
              >
                Фильтры{activeFiltersCount ? ` (${activeFiltersCount})` : ''}
              </Button>
            </Stack>

            {appliedFilterChips.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                {appliedFilterChips.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    onDelete={() => clearAppliedFilter(chip.key)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
                <Button size="small" onClick={clearAllAppliedFilters}>
                  Сбросить всё
                </Button>
              </Stack>
            ) : null}

            {resultsQuery.data && resultsQuery.data.items.length > 0 ? (
              <TitleGrid titles={resultsQuery.data.items} />
            ) : (
              emptyState ?? <EmptyState title="Ничего не найдено" description="Измените запрос или ослабьте фильтры, чтобы увидеть больше тайтлов из каталога." />
            )}

            {(resultsQuery.data?.pageCount ?? 1) > 1 ? (
              <Pagination
                count={resultsQuery.data?.pageCount ?? 1}
                page={resultsQuery.data?.page ?? 1}
                onChange={(_event, page) => updateParams({ page })}
              />
            ) : null}
          </Stack>
        </Grid>
      </Grid>

      <Drawer
        id="catalog-mobile-drawer"
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {mobileDrawerContent}
      </Drawer>
    </PageShell>
  );
}
