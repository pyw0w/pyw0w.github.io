import { Alert } from '@mui/material';
import { BrowsePage } from '../browse/BrowsePage';

export function SearchPage() {
  return (
    <BrowsePage
      title="Search"
      subtitle="Расширенный поиск по каталогу с теми же фильтрами, что и в browse."
      emptyState={<Alert severity="info">Введите запрос или выберите фильтры, чтобы найти тайтл.</Alert>}
    />
  );
}
