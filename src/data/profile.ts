import type { ExperienceItem, SkillGroup } from '../types';

export const PROFILE = {
  name: 'pyw0w',
  title: 'Опытный программист и дизайнер современных интерфейсов',
  summary:
    'Создаю современные web-интерфейсы с упором на архитектуру, визуальную выразительность и производительность.',
  githubUrl: 'https://github.com/pyw0w',
};

export const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    title: 'Frontend / UI Engineer',
    period: '2024 - сейчас',
    highlights: [
      'Проектировал и реализовывал интерфейсы для веб-продуктов с акцентом на UX.',
      'Оптимизировал рендеринг сложных UI-сцен, уменьшая время загрузки интерфейсов.',
    ],
  },
  {
    title: 'Fullstack Developer',
    period: '2023 - 2024',
    highlights: [
      'Разрабатывал SPA и API для продуктовых сценариев с фокусом на устойчивость.',
      'Строил процессы CI/CD и автоматизацию обновления данных для фронтенда.',
    ],
  },
  {
    title: 'UI Designer + Developer',
    period: '2022 - 2023',
    highlights: [
      'Формировал визуальную систему интерфейсов и переводил ее в production-ready код.',
      'Создавал интерактивные прототипы и анимированные дизайн-решения.',
    ],
  },
  {
    title: 'Product Engineering Contributor',
    period: '2021 - 2022',
    highlights: [
      'Участвовал в запуске новых функциональностей от идеи до релиза.',
      'Синхронизировал требования между разработкой и дизайном для быстрого выхода в прод.',
    ],
  },
  {
    title: 'Freelance Web Projects',
    period: '2020 - 2021',
    highlights: [
      'Делал клиентские сайты и интерфейсы с адаптивной версткой.',
      'Поддерживал и развивал проекты после релиза, включая UX-улучшения.',
    ],
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Frontend',
    skills: ['React', 'TypeScript', 'Vite', 'HTML5', 'CSS3', 'Web Animations'],
  },
  {
    category: 'Backend',
    skills: ['Node.js', 'REST API', 'Express', 'GitHub API', 'CI/CD'],
  },
  {
    category: 'Design',
    skills: ['UI Systems', 'Motion Design', 'Interaction Design', 'Figma'],
  },
  {
    category: '3D',
    skills: ['Three.js', '@react-three/fiber', '@react-three/drei', 'Scene Optimization'],
  },
  {
    category: 'AI',
    skills: ['Prompt Engineering', 'LLM Workflows', 'Automation'],
  },
];
