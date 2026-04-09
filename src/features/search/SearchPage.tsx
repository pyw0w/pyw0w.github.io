import { Alert } from '@mui/material';
import { SearchCatalogPage } from './SearchCatalogPage';

export function SearchPage() {
  return (
    <SearchCatalogPage
      title="Search"
      subtitle="Единый каталог с поиском, фильтрами, сортировкой и URL-параметрами."
      emptyState={<Alert severity="info">Введите запрос или выберите фильтры, чтобы найти тайтл.</Alert>}
    />
  );
}
