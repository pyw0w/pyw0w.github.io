import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

interface CatalogFreshnessProps {
  generatedAt: string;
}

function getCatalogFreshnessMeta(generatedAt: string): {
  color: string;
  title: string;
  description: string;
} {
  const generatedAtDate = new Date(generatedAt);
  const ageMs = Date.now() - generatedAtDate.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const timestamp = Number.isFinite(generatedAtDate.getTime())
    ? generatedAtDate.toLocaleString('ru-RU')
    : 'время обновления недоступно';

  if (!Number.isFinite(ageHours) || ageHours <= 24) {
    return {
      color: 'text.secondary',
      title: `Каталог обновлён ${timestamp}`,
      description: 'Каталог собран во время последнего build и может немного отставать от источника.',
    };
  }

  if (ageHours <= 72) {
    return {
      color: 'warning.main',
      title: `Каталог обновлён ${timestamp}`,
      description: 'Snapshot каталога не обновлялся больше суток. Новые релизы и изменения могут появляться с задержкой.',
    };
  }

  return {
    color: 'warning.main',
    title: `Каталог обновлён ${timestamp}`,
    description: 'Snapshot каталога не обновлялся уже несколько дней. Данные сайта могут заметно отставать от источника.',
  };
}

export function CatalogFreshness({ generatedAt }: CatalogFreshnessProps) {
  const freshness = getCatalogFreshnessMeta(generatedAt);

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: (theme) => theme.zIndex.tooltip - 1,
      }}
    >
      <Tooltip
        arrow
        placement="top"
        title={(
          <Box>
            <Typography variant="subtitle2">{freshness.title}</Typography>
            <Typography variant="body2">{freshness.description}</Typography>
          </Box>
        )}
      >
        <Box
          component="button"
          type="button"
          aria-label={freshness.title}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            p: 0,
            border: 0,
            borderRadius: '50%',
            backgroundColor: 'background.paper',
            boxShadow: 3,
            color: freshness.color,
            cursor: 'help',
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </Box>
      </Tooltip>
    </Box>
  );
}
