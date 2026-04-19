import { useQuery } from '@tanstack/react-query';
import { Alert, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import { getChangelogSnapshot } from '../../shared/api/changelog';
import { PageShell } from '../../shared/ui/PageShell';
import { EmptyState } from '../../shared/ui/EmptyState';

export function ChangelogPage() {
  const changelogQuery = useQuery({ queryKey: ['changelogSnapshot'], queryFn: getChangelogSnapshot });

  return (
    <PageShell
      title="Changelog"
      subtitle="Текущая версия сайта и последние изменения, собранные из git-репозитория во время build."
      isLoading={changelogQuery.isLoading}
      banner={changelogQuery.isError ? <Alert severity="warning">Не удалось загрузить changelog.</Alert> : undefined}
    >
      {changelogQuery.data ? (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Chip color="primary" label={`v${changelogQuery.data.version}`} />
                  <Chip label={changelogQuery.data.shortCommit} />
                  <Chip label={new Date(changelogQuery.data.generatedAt).toLocaleString('ru-RU')} />
                </Stack>
                <Typography color="text.secondary">
                  Сборка основана на коммите{' '}
                  <Link href={`https://github.com/pyw0w/pyw0w.github.io/commit/${changelogQuery.data.commit}`} target="_blank" rel="noreferrer">
                    {changelogQuery.data.shortCommit}
                  </Link>
                  , зафиксированном {new Date(changelogQuery.data.committedAt).toLocaleString('ru-RU')}.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            <Typography variant="h4" component="h2">Последние изменения</Typography>
            {changelogQuery.data.entries.length > 0 ? (
              <Stack spacing={2}>
                {changelogQuery.data.entries.map((entry) => (
                  <Card key={entry.sha}>
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                          <Chip label={entry.shortSha} size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(entry.committedAt).toLocaleString('ru-RU')}
                          </Typography>
                        </Stack>
                        <Typography variant="h6">{entry.subject}</Typography>
                        <Link href={`https://github.com/pyw0w/pyw0w.github.io/commit/${entry.sha}`} target="_blank" rel="noreferrer">
                          Открыть commit на GitHub
                        </Link>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <EmptyState title="Changelog пока пуст" description="Когда в репозитории появятся новые коммиты, они начнут отображаться на этой странице автоматически при следующем build." />
            )}
          </Stack>
        </Stack>
      ) : null}
    </PageShell>
  );
}
