import { Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { CatalogTitle } from '../../entities/catalog';
import { titlePath } from '../lib/routes';
import { formatScore } from '../lib/text';

interface TitleCardProps {
  title: CatalogTitle;
}

export function TitleCard({ title }: TitleCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea component={RouterLink} to={titlePath(title)} sx={{ height: '100%', alignItems: 'stretch' }}>
        <CardMedia
          component="img"
          image={title.poster}
          alt={title.title}
          sx={{ aspectRatio: '57 / 75', objectFit: 'cover' }}
        />
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={title.type || 'Тайтл'} size="small" />
              <Chip label={title.status} size="small" color={title.status === 'Онгоинг' ? 'secondary' : 'default'} />
              <Chip label={`★ ${formatScore(title.averageScore)}`} size="small" />
            </Stack>
            <Typography variant="h6" component="h2" sx={{ lineHeight: 1.25 }}>
              {title.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title.shortDescription}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
