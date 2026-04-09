import { Grid } from '@mui/material';
import type { CatalogTitle } from '../../entities/catalog';
import { TitleCard } from './TitleCard';

interface TitleGridProps {
  titles: CatalogTitle[];
}

export function TitleGrid({ titles }: TitleGridProps) {
  return (
    <Grid container spacing={3}>
      {titles.map((title) => (
        <Grid key={title.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <TitleCard title={title} />
        </Grid>
      ))}
    </Grid>
  );
}
