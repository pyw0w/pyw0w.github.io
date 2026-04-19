import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

interface TitleGridSkeletonProps {
  count?: number;
}

export function TitleGridSkeleton({ count = 8 }: TitleGridSkeletonProps) {
  return (
    <Grid container spacing={3} aria-hidden="true">
      {Array.from({ length: count }).map((_item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ aspectRatio: '57 / 75', width: '100%' }}>
              <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
            </Box>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={48} height={24} />
                </Stack>
                <Skeleton variant="text" height={28} width="80%" />
                <Skeleton variant="text" height={18} />
                <Skeleton variant="text" height={18} width="70%" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
