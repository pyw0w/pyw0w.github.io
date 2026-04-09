import { SearchCatalogPage } from './SearchCatalogPage';
import { EmptyState } from '../../shared/ui/EmptyState';

export function SearchPage() {
  return (
    <SearchCatalogPage
      title="Search"
      subtitle="Единый каталог с поиском, фильтрами, сортировкой и URL-параметрами."
      emptyState={<EmptyState title="Настройте поиск" description="Введите запрос или выберите фильтры, чтобы быстро собрать подходящую подборку тайтлов." />}
    />
  );
}
