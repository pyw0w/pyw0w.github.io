import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');
const outputPath = join(rootDir, 'public', 'data', 'changelog.json');
const CHANGELOG_LIMIT = 12;

async function readPackageVersion() {
  const raw = await readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.version ?? '0.0.0';
}

async function runGit(args) {
  const { stdout } = await execFileAsync('git', args, { cwd: rootDir });
  return stdout.trim();
}

async function getTagVersion(fallbackVersion) {
  try {
    const tag = await runGit(['describe', '--tags', '--abbrev=0']);
    return tag || fallbackVersion;
  } catch {
    return fallbackVersion;
  }
}

async function getHeadCommit() {
  const format = ['%H', '%h', '%cI', '%s'].join('%x1f');
  const raw = await runGit(['log', '-1', `--pretty=format:${format}`]);
  const [sha, shortSha, committedAt, subject] = raw.split('\x1f');
  return { sha, shortSha, committedAt, subject };
}

async function getRecentEntries() {
  const format = ['%H', '%h', '%cI', '%s'].join('%x1f');
  const raw = await runGit(['log', `-${CHANGELOG_LIMIT}`, `--pretty=format:${format}`]);
  if (!raw) return [];

  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, shortSha, committedAt, subject] = line.split('\x1f');
      return { sha, shortSha, committedAt, subject };
    });
}

async function main() {
  console.log('Generating changelog artifact from git history...');
  const packageVersion = await readPackageVersion();
  const version = await getTagVersion(packageVersion);
  const head = await getHeadCommit();
  const entries = await getRecentEntries();

  const payload = {
    version,
    packageVersion,
    commit: head.sha,
    shortCommit: head.shortSha,
    committedAt: head.committedAt,
    generatedAt: new Date().toISOString(),
    entries,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Saved changelog artifact to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
