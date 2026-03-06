import type {
  ContactLink,
  ExperienceItem,
  FeaturedCase,
  HeroMetric,
  Principle,
  SkillGroup,
} from '../types';

export const PROFILE = {
  name: 'pyw0w',
  title: 'Проектирую цифровые истории и довожу их до production без потери характера.',
  summary:
    'Соединяю визуальную режиссуру, frontend-инженерию и продуктовую дисциплину, чтобы интерфейсы выглядели смело, читались быстро и работали устойчиво.',
  manifesto:
    'Мне интересны не просто красивые экраны, а сайты и продукты, у которых есть осознанный ритм, точная иерархия и ощущение авторского контроля в каждой детали.',
  intro:
    'Работаю как гибрид designer-engineer: могу придумать образ, собрать систему, заложить motion и дотянуть реализацию до production-уровня без разрыва между концепцией и кодом.',
  availability: 'Remote / selective collaborations',
  githubUrl: 'https://github.com/pyw0w',
  contactSummary:
    'Лучше всего захожу в задачи, где нужен не просто исполнитель, а человек, который соберёт цельную цифровую подачу: от визуального направления до живого интерфейса.',
};

export const HERO_METRICS: HeroMetric[] = [
  { label: 'Фокус', value: 'Brand-first UI' },
  { label: 'Режим', value: 'Design + Code' },
  { label: 'Формат', value: 'Web / Interactive' },
];

export const PRINCIPLES: Principle[] = [
  {
    title: 'Сначала образ, потом интерфейс',
    description:
      'Каждый проект начинаю с тона, ритма и ощущения. Если нет визуального тезиса, интерфейс распадается на набор блоков.',
  },
  {
    title: 'Система важнее вау-элемента',
    description:
      'Даже самый эффектный экран должен держаться на ясной типографике, устойчивой сетке и понятной логике поведения.',
  },
  {
    title: 'Production не должен убивать идею',
    description:
      'Я не отдаю концепт “кому-то на реализацию”, а довожу его в коде сам, сохраняя нюансы, анимацию и общее впечатление.',
  },
];

export const FEATURED_CASES: FeaturedCase[] = [
  {
    slug: 'digital-presence',
    category: 'Brand Experience',
    title: 'Редакционный digital presence для личного бренда и продуктовой экспертизы.',
    summary:
      'Собираю подачу не как набор типовых секций, а как последовательность сцен: манифест, напряжение, доверие, кейсы и чёткий CTA.',
    outcome:
      'Сайт начинает работать как самостоятельный бренд-объект, а не только как склад ссылок и технологий.',
    role: 'Concept, UI direction, frontend implementation, motion',
    year: '2026',
    techStack: ['React', 'TypeScript', 'GSAP', 'Editorial Layout'],
    links: [{ label: 'GitHub профиль', href: 'https://github.com/pyw0w' }],
  },
  {
    slug: 'interactive-showcase',
    category: 'Interactive Frontend',
    title: 'Интерактивные интерфейсы с сильной подачей и контролем производительности.',
    summary:
      'Работаю с насыщенными layout-сценами, динамическими слоями и motion-системой так, чтобы эффектность не разрушала чтение и не ломала мобильный сценарий.',
    outcome:
      'Пользователь видит характерный интерфейс, а команда получает поддерживаемую и понятную кодовую базу.',
    role: 'Visual systems, UI architecture, adaptive behavior',
    year: '2025',
    techStack: ['React', 'CSS Systems', 'Motion Design', 'Responsive UI'],
    links: [{ label: 'Открыть GitHub', href: 'https://github.com/pyw0w' }],
  },
  {
    slug: 'content-pipeline',
    category: 'Automation',
    title: 'Контентные и проектные витрины, которые можно обновлять без ручной рутины.',
    summary:
      'Автоматизирую слои данных, синхронизацию репозиториев и структурирование контента, чтобы фронтенд оставался живым и актуальным.',
    outcome:
      'Визуально выразительный сайт не превращается в хрупкую витрину, требующую постоянной ручной поддержки.',
    role: 'Data flow, integration logic, frontend delivery',
    year: '2024',
    techStack: ['Node.js', 'GitHub API', 'Vite', 'Content Modeling'],
    links: [{ label: 'Архив репозиториев', href: 'https://github.com/pyw0w?tab=repositories' }],
  },
];

export const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    title: 'Frontend / UI Engineer',
    period: '2024 - сейчас',
    highlights: [
      'Собираю интерфейсы с сильным визуальным тезисом и довожу их до production без потери динамики.',
      'Синхронизирую дизайн, motion и поведение компонентов так, чтобы продукт ощущался цельным.',
    ],
  },
  {
    title: 'Fullstack Developer',
    period: '2023 - 2024',
    highlights: [
      'Проектировал SPA и сервисные слои для продуктовых сценариев, где важны устойчивость и ясная структура.',
      'Автоматизировал пайплайны данных и обновление контента для публичных витрин и внутренних интерфейсов.',
    ],
  },
  {
    title: 'UI Designer + Developer',
    period: '2022 - 2023',
    highlights: [
      'Формировал визуальные системы и переводил их в production-ready код без потери авторского характера.',
      'Создавал интерактивные прототипы и анимационные сценарии для презентационных и продуктовых экранов.',
    ],
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Interface Systems',
    skills: ['React', 'TypeScript', 'Vite', 'Responsive Layouts', 'Component Architecture'],
  },
  {
    category: 'Motion + Feel',
    skills: ['GSAP', 'Scroll Choreography', 'Narrative UI', 'Micro-interactions'],
  },
  {
    category: 'Design Direction',
    skills: ['Editorial Composition', 'Typography', 'Interaction Design', 'Visual Systems'],
  },
  {
    category: 'Delivery Layer',
    skills: ['Node.js', 'GitHub API', 'Automation', 'Content Modeling', 'CI/CD'],
  },
];

export const CONTACT_LINKS: ContactLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/pyw0w',
    note: 'Основной публичный канал и архив работ',
  },
  {
    label: 'Repositories',
    href: 'https://github.com/pyw0w?tab=repositories',
    note: 'Полный список репозиториев и активных экспериментов',
  },
];
