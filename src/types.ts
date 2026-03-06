export const PROJECT_CATEGORIES = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Design',
  '3D',
  'AI',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectStatus = 'active' | 'maintenance';

export interface Project {
  id: number;
  name: string;
  description: string;
  techStack: string[];
  categories: ProjectCategory[];
  repoUrl: string;
  demoUrl?: string;
  status: ProjectStatus;
  updatedAt: string;
  stars: number;
  topics: string[];
}

export interface ProjectsCache {
  generatedAt: string;
  source: 'github-api' | 'cache';
  projects: Project[];
}

export interface ExperienceItem {
  title: string;
  period: string;
  highlights: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Principle {
  title: string;
  description: string;
}

export interface FeaturedCase {
  slug: string;
  category: string;
  title: string;
  summary: string;
  outcome: string;
  role: string;
  year: string;
  techStack: string[];
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface HeroMetric {
  label: string;
  value: string;
}

export interface ContactLink {
  label: string;
  href: string;
  note: string;
}
