import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { CatalogParams, TitleStatus } from '../../entities/catalog';
import {
  buildCatalogSearchParams,
  DEFAULT_CATALOG_PARAMS,
  getCatalogSearchData,
  normalizeCatalogParams,
  parseCatalogSearchParams,
} from '../../shared/api/catalog';
import { trackEvent } from '../../shared/telemetry/events';
import { useDebouncedValue } from '../../shared/lib/useDebouncedValue';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';
import { EmptyState } from '../../shared/ui/EmptyState';
import { CatalogFreshness } from '../../shared/ui/CatalogFreshness';

interface CatalogParamsController {
  params: CatalogParams;
  queryString: string;
  applyParams: (next: CatalogParams) => void;
  replaceParams: (next: CatalogParams) => void;
  updateParams: (patch: Partial<CatalogParams>) => void;
}

function useCatalogParams(): CatalogParamsController {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => parseCatalogSearchParams(searchParams), [searchParams]);
  const queryString = useMemo(() => buildCatalogSearchParams(params).toString(), [params]);

  const replaceParams = useCallback((next: CatalogParams) => {
    setSearchParams(buildCatalogSearchParams(next), { replace: true });
  }, [setSearchParams]);

  const applyParams = useCallback((next: CatalogParams) => {
    const normalized = normalizeCatalogParams(next);
    setSearchParams(buildCatalogSearchParams(normalized), { replace: true });
    trackEvent('filter_change', { ...normalized });
  }, [setSearchParams]);

  const updateParams = useCallback((patch: Partial<CatalogParams>) => {
    applyParams({ ...params, ...patch });
  }, [applyParams, params]);

  return { params, queryString, applyParams, replaceParams, updateParams };
}

interface FilterControlsProps {
  params: CatalogParams;
  updateParams: (patch: Partial<CatalogParams>) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  genres: string[];
  years: string[];
  types: string[];
  statuses: TitleStatus[];
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

function FilterControls({
  params,
  updateParams,
  searchInput,
  onSearchInputChange,
  genres,
  years,
  types,
  statuses,
}: FilterControlsProps) {
  return (
    <Stack spacing={2.5} sx={{ p: { xs: 0, md: 0 } }}>
      <TextField
        label="Поиск"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
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
  const { params, queryString, applyParams, replaceParams, updateParams } = useCatalogParams();
  const searchQuery = useQuery({
    queryKey: ['catalogSearch', queryString],
    queryFn: () => getCatalogSearchData(params),
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftParams, setDraftParams] = useState<CatalogParams>(params);
  const [searchInput, setSearchInput] = useState<string>(params.search);
  const [draftSearchInput, setDraftSearchInput] = useState<string>(params.search);
  const debouncedSearchInput = useDebouncedValue(searchInput, 250);

  useEffect(() => {
    setSearchInput(params.search);
  }, [params.search]);

  useEffect(() => {
    if (debouncedSearchInput === params.search) return;
    updateParams({ search: debouncedSearchInput, page: 1 });
  }, [debouncedSearchInput, params.search, updateParams]);

  useEffect(() => {
    if (!mobileOpen) return;
    setDraftParams(params);
    setDraftSearchInput(params.search);
  }, [mobileOpen, params]);

  useEffect(() => {
    if (!searchQuery.data) return;
    const canonicalQueryString = buildCatalogSearchParams(searchQuery.data.params).toString();
    if (canonicalQueryString === queryString) return;
    replaceParams(searchQuery.data.params);
  }, [queryString, replaceParams, searchQuery.data]);

  const filters = searchQuery.data?.filters;
  const result = searchQuery.data?.result;
  const activeFiltersCount = useMemo(() => getActiveFiltersCount(params), [params]);
  const appliedFilterChips = useMemo(() => getAppliedFilterChips(params), [params]);

  function updateDraftParams(patch: Partial<CatalogParams>) {
    setDraftParams((current) => ({ ...current, ...patch }));
  }

  function resetDraftParams() {
    setDraftParams(DEFAULT_CATALOG_PARAMS);
    setDraftSearchInput(DEFAULT_CATALOG_PARAMS.search);
  }

  function applyDraftParams() {
    applyParams({ ...draftParams, search: draftSearchInput, page: 1 });
    setSearchInput(draftSearchInput);
    setMobileOpen(false);
  }

  function clearAppliedFilter(key: keyof CatalogParams) {
    const patch: Partial<CatalogParams> = { [key]: DEFAULT_CATALOG_PARAMS[key], page: 1 };
    if (key === 'search') setSearchInput(DEFAULT_CATALOG_PARAMS.search);
    applyParams({ ...params, ...patch });
  }

  function clearAllAppliedFilters() {
    setSearchInput(DEFAULT_CATALOG_PARAMS.search);
    applyParams(DEFAULT_CATALOG_PARAMS);
  }

  const desktopFilters = filters ? (
    <Box sx={{ width: { xs: 320, md: 'auto' }, p: { xs: 2.5, md: 0 } }}>
      <FilterControls
        params={params}
        updateParams={(patch) => updateParams({ ...patch, page: 1 })}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
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
          Активно: {getActiveFiltersCount({ ...draftParams, search: draftSearchInput })}
        </Typography>
      </Stack>

      <FilterControls
        params={draftParams}
        updateParams={(patch) => updateDraftParams({ ...patch, page: 1 })}
        searchInput={draftSearchInput}
        onSearchInputChange={setDraftSearchInput}
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
      isLoading={searchQuery.isLoading}
      banner={searchQuery.isError ? <Alert severity="warning">Не удалось загрузить snapshot каталога. Поиск временно недоступен, пока сайт не получит свежую сборку данных.</Alert> : undefined}
    >
      <Stack spacing={3}>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            {desktopFilters}
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                <Typography color="text.secondary">
                  Найдено: {result?.total ?? 0}
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

              {result ? (
                result.items.length > 0 ? (
                  <TitleGrid titles={result.items} />
                ) : (
                  emptyState ?? <EmptyState title="Ничего не найдено" description="Измените запрос или ослабьте фильтры, чтобы увидеть больше тайтлов из каталога." />
                )
              ) : null}

              {(result?.pageCount ?? 1) > 1 ? (
                <Pagination
                  count={result?.pageCount ?? 1}
                  page={result?.page ?? 1}
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

        {searchQuery.data ? <CatalogFreshness generatedAt={searchQuery.data.generatedAt} /> : null}
      </Stack>
    </PageShell>
  );
}
