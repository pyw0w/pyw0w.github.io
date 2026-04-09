import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
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
import { useSearchParams } from 'react-router-dom';
import type { CatalogParams } from '../../entities/catalog';
import { getCatalogResults, getCatalogSnapshot } from '../../shared/api/catalog';
import { trackEvent } from '../../shared/analytics/events';
import { PageShell } from '../../shared/ui/PageShell';
import { TitleGrid } from '../../shared/ui/TitleGrid';

function useCatalogParams(): [CatalogParams, (patch: Partial<CatalogParams>) => void] {
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

  function update(nextPatch: Partial<CatalogParams>) {
    const next = { ...params, ...nextPatch };
    const nextSearch = new URLSearchParams();

    if (next.search) nextSearch.set('q', next.search);
    if (next.genre) nextSearch.set('genre', next.genre);
    if (next.status) nextSearch.set('status', next.status);
    if (next.year) nextSearch.set('year', next.year);
    if (next.type) nextSearch.set('type', next.type);
    if (next.sort && next.sort !== 'latest') nextSearch.set('sort', next.sort);
    if (next.page > 1) nextSearch.set('page', String(next.page));

    setSearchParams(nextSearch, { replace: true });
    trackEvent('filter_change', next);
  }

  return [params, update];
}

interface FilterControlsProps {
  params: CatalogParams;
  updateParams: (patch: Partial<CatalogParams>) => void;
  genres: string[];
  years: string[];
  types: string[];
  statuses: string[];
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
  const [params, updateParams] = useCatalogParams();
  const [searchParams] = useSearchParams();
  const filtersQuery = useQuery({ queryKey: ['catalogSnapshot'], queryFn: getCatalogSnapshot });
  const resultsQuery = useQuery({ queryKey: ['catalog', params], queryFn: () => getCatalogResults(params) });
  const [mobileOpen, setMobileOpen] = useState(false);

  const filters = filtersQuery.data?.filters;
  const drawerContent = filters ? (
    <Box sx={{ width: { xs: 320, md: 'auto' }, p: { xs: 2.5, md: 0 } }}>
      <FilterControls
        params={params}
        updateParams={updateParams}
        genres={filters.genres}
        years={filters.years}
        types={filters.types}
        statuses={filters.statuses}
      />
    </Box>
  ) : null;

  const activeFiltersCount = ['genre', 'status', 'year', 'type'].filter((key) => Boolean(searchParams.get(key))).length;

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      isLoading={filtersQuery.isLoading || resultsQuery.isLoading}
      banner={resultsQuery.isError ? <Alert severity="warning">Каталог временно недоступен.</Alert> : undefined}
    >
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          {drawerContent}
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

            {resultsQuery.data && resultsQuery.data.items.length > 0 ? (
              <TitleGrid titles={resultsQuery.data.items} />
            ) : (
              emptyState ?? <Alert severity="info">По текущим фильтрам ничего не найдено.</Alert>
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
        {drawerContent}
      </Drawer>
    </PageShell>
  );
}
