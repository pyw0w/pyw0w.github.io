import type { PropsWithChildren, ReactNode } from 'react';
import { Alert, Box, CircularProgress, Container, Stack, Typography } from '@mui/material';

interface PageShellProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  banner?: ReactNode;
  isLoading?: boolean;
}

export function PageShell({ title, subtitle, banner, isLoading, children }: PageShellProps) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {banner ?? null}

        {isLoading ? (
          <Alert
            icon={<CircularProgress color="inherit" size={18} />}
            severity="info"
            sx={{ alignItems: 'center' }}
          >
            Загружаем данные…
          </Alert>
        ) : null}

        {children}
      </Stack>
    </Container>
  );
}
