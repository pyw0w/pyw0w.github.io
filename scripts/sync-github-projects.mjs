import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const cacheDir = path.join(projectRoot, 'src', 'data', 'cache');
const projectsPath = path.join(cacheDir, 'projects.json');
const metaPath = path.join(cacheDir, 'github-meta.json');

const CATEGORY_SET = new Set(['Frontend', 'Backend', 'Fullstack', 'Design', '3D', 'AI']);

const KEYWORDS = {
  Frontend: ['frontend', 'react', 'vue', 'svelte', 'angular', 'ui', 'css', 'webapp'],
  Backend: ['backend', 'api', 'server', 'express', 'fastapi', 'nestjs', 'database'],
  Fullstack: ['fullstack', 'full-stack'],
  Design: ['design', 'ui', 'ux', 'figma', 'prototype'],
  '3D': ['3d', 'three', 'threejs', 'webgl', 'shader', 'blender'],
  AI: ['ai', 'llm', 'ml', 'machine-learning', 'openai', 'gpt', 'rag', 'agent'],
};

const TECH_KEYWORDS = [
  'react',
  'typescript',
  'javascript',
  'node',
  'nextjs',
  'vite',
  'threejs',
  'webgl',
  'tailwind',
  'graphql',
  'postgresql',
  'mongodb',
  'docker',
  'python',
  'go',
  'rust',
  'openai',
  'ai',
];

function normalizeTopic(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9+.#-]/g, '');
}

function titleCase(value) {
  if (!value) {
    return value;
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function unique(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

function deriveCategories(repo) {
  const topics = (repo.topics ?? []).map(normalizeTopic);
  const language = (repo.language ?? '').toLowerCase();
  const blob = `${repo.name} ${repo.description ?? ''} ${topics.join(' ')}`.toLowerCase();
  const categories = new Set();

  for (const [category, words] of Object.entries(KEYWORDS)) {
    const matches = words.some((word) => blob.includes(word));
    if (matches && CATEGORY_SET.has(category)) {
      categories.add(category);
    }
  }

  const frontendLanguage = ['javascript', 'typescript', 'html', 'css'];
  const backendLanguage = ['python', 'go', 'rust', 'java', 'kotlin', 'c#', 'php'];

  if (frontendLanguage.includes(language)) {
    categories.add('Frontend');
  }

  if (backendLanguage.includes(language)) {
    categories.add('Backend');
  }

  if (categories.has('Frontend') && categories.has('Backend')) {
    categories.add('Fullstack');
  }

  if (categories.size === 0) {
    categories.add(language === 'javascript' || language === 'typescript' ? 'Frontend' : 'Backend');
  }

  return [...categories].filter((category) => CATEGORY_SET.has(category));
}

function deriveTechStack(repo) {
  const language = repo.language ? [repo.language] : [];
  const topics = (repo.topics ?? []).map(normalizeTopic);
  const inferred = [];

  for (const topic of topics) {
    if (TECH_KEYWORDS.includes(topic)) {
      inferred.push(titleCase(topic));
    }
  }

  if (repo.name.toLowerCase().includes('vite')) {
    inferred.push('Vite');
  }

  if ((repo.description ?? '').toLowerCase().includes('three')) {
    inferred.push('Three.js');
  }

  return unique([...language, ...inferred]);
}

function deriveStatus(repo) {
  const updatedAtMs = new Date(repo.pushed_at ?? repo.updated_at).getTime();
  const ageDays = (Date.now() - updatedAtMs) / (1000 * 60 * 60 * 24);

  return ageDays <= 120 ? 'active' : 'maintenance';
}

function extractNextUrl(linkHeader) {
  if (!linkHeader) {
    return null;
  }

  const part = linkHeader
    .split(',')
    .map((entry) => entry.trim())
    .find((entry) => entry.endsWith('rel="next"'));

  if (!part) {
    return null;
  }

  const match = part.match(/<([^>]+)>/);
  return match ? match[1] : null;
}

async function readJsonSafe(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchAllRepos({ username, token, etag }) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-sync-script',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  let nextUrl = `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated&direction=desc&page=1`;
  const allRepos = [];
  let firstResponse = null;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });

    if (!firstResponse) {
      firstResponse = response;
    }

    if (response.status === 304) {
      return {
        status: 304,
        repos: [],
        etag,
      };
    }

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${responseText}`);
    }

    const pageRepos = await response.json();
    allRepos.push(...pageRepos);
    nextUrl = extractNextUrl(response.headers.get('link'));

    delete headers['If-None-Match'];
  }

  return {
    status: 200,
    repos: allRepos,
    etag: firstResponse?.headers.get('etag') ?? null,
  };
}

async function main() {
  await mkdir(cacheDir, { recursive: true });

  const ownerFromRepo = process.env.GITHUB_REPOSITORY?.split('/')[0];
  const username = process.env.GITHUB_USERNAME ?? ownerFromRepo;
  const token = process.env.GITHUB_TOKEN ?? process.env.PORTFOLIO_GITHUB_TOKEN ?? '';

  if (!username) {
    throw new Error(
      'Не удалось определить GitHub username. Укажи GITHUB_USERNAME или GITHUB_REPOSITORY в окружении.',
    );
  }

  const existingCache = await readJsonSafe(projectsPath);
  const existingMeta = await readJsonSafe(metaPath);

  try {
    const response = await fetchAllRepos({ username, token, etag: existingMeta?.etag ?? null });

    if (response.status === 304 && existingCache) {
      console.log('GitHub API: 304 Not Modified, используем текущий локальный кэш.');
      return;
    }

    const projects = response.repos
      .filter((repo) => !repo.fork)
      .filter((repo) => !repo.archived)
      .filter((repo) => Boolean((repo.description ?? '').trim()))
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description.trim(),
        techStack: deriveTechStack(repo),
        categories: deriveCategories(repo),
        repoUrl: repo.html_url,
        demoUrl: repo.homepage || undefined,
        status: deriveStatus(repo),
        updatedAt: repo.updated_at,
        stars: repo.stargazers_count ?? 0,
        topics: (repo.topics ?? []).map(normalizeTopic),
      }))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

    const payload = {
      generatedAt: new Date().toISOString(),
      source: 'github-api',
      projects,
    };

    await writeFile(projectsPath, JSON.stringify(payload, null, 2));
    await writeFile(
      metaPath,
      JSON.stringify(
        {
          lastSyncedAt: new Date().toISOString(),
          username,
          etag: response.etag,
        },
        null,
        2,
      ),
    );

    console.log(`Синхронизировано проектов: ${projects.length}`);
  } catch (error) {
    if (existingCache?.projects?.length >= 0) {
      console.warn('Ошибка синхронизации GitHub API, оставляю последний локальный кэш.');
      console.warn(String(error));
      return;
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
