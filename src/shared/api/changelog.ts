import { z } from 'zod';
import { getBasePath } from './catalog';

const changelogEntrySchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  committedAt: z.string(),
  subject: z.string(),
});

const changelogSchema = z.object({
  version: z.string(),
  packageVersion: z.string(),
  commit: z.string(),
  shortCommit: z.string(),
  committedAt: z.string(),
  generatedAt: z.string(),
  entries: z.array(changelogEntrySchema),
});

export type ChangelogEntry = z.infer<typeof changelogEntrySchema>;
export type ChangelogSnapshot = z.infer<typeof changelogSchema>;

let changelogPromise: Promise<ChangelogSnapshot> | null = null;

export async function getChangelogSnapshot(): Promise<ChangelogSnapshot> {
  if (!changelogPromise) {
    changelogPromise = fetch(`${getBasePath()}/data/changelog.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load changelog snapshot: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => changelogSchema.parse(payload));
  }

  return changelogPromise;
}
