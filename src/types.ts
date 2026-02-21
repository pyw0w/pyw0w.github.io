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
