import type { ReactNode } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'error';
  actionLabel?: string;
  actionTo?: string;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  severity = 'info',
  actionLabel,
  actionTo,
  action,
}: EmptyStateProps) {
  return (
    <Alert
      severity={severity}
      sx={{
        borderRadius: 3,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
        {action ?? (actionLabel && actionTo ? <Button component={RouterLink} to={actionTo} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }}>{actionLabel}</Button> : null)}
      </Stack>
    </Alert>
  );
}
