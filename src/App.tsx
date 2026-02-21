import { useMemo, useRef, useState } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectModal } from './components/ProjectModal';
import { AdaptiveScene } from './components/scene/AdaptiveScene';
import { RevealSection } from './components/ui/RevealSection';
import projectsCache from './data/cache/projects.json';
import { EXPERIENCE_ITEMS, PROFILE, SKILL_GROUPS } from './data/profile';
import { useGsapDesign } from './hooks/useGsapDesign';
import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectCategory,
  type ProjectsCache,
} from './types';

const ALL_CATEGORY = 'Все';
const EXPERIENCE_PREVIEW_COUNT = 4;

type CategoryFilter = ProjectCategory | typeof ALL_CATEGORY;

function sortByUpdatedDesc(items: Project[]) {
  return [...items].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function App() {
  const appRef = useRef<HTMLDivElement | null>(null);
  const cache = projectsCache as ProjectsCache;
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORY);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAllExperience, setShowAllExperience] = useState(false);

  const projects = useMemo(() => sortByUpdatedDesc(cache.projects), [cache.projects]);

  const visibleProjects = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) {
      return projects;
    }

    return projects.filter((project) => project.categories.includes(activeCategory));
  }, [activeCategory, projects]);

  const visibleExperience = showAllExperience
    ? EXPERIENCE_ITEMS
    : EXPERIENCE_ITEMS.slice(0, EXPERIENCE_PREVIEW_COUNT);

  const filters: CategoryFilter[] = [ALL_CATEGORY, ...PROJECT_CATEGORIES];

  const activeProjectsCount = useMemo(
    () => projects.filter((project) => project.status === 'active').length,
    [projects],
  );

  const keyStacks = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.techStack))).slice(0, 8),
    [projects],
  );

  const newestUpdate = projects[0]
    ? new Date(projects[0].updatedAt).toLocaleDateString('ru-RU')
    : 'нет данных';

  useGsapDesign(appRef, [activeCategory, visibleProjects.length, showAllExperience]);

  return (
    <div ref={appRef} className="app-shell">
      <AdaptiveScene />
      <div className="ambient-orb orb-a" aria-hidden />
      <div className="ambient-orb orb-b" aria-hidden />
      <div className="ambient-lines" aria-hidden />

      <header className="site-header panel-chrome">
        <a className="logo" href="#top">
          {PROFILE.name}
        </a>
        <nav>
          <a href="#projects">Проекты</a>
          <a href="#experience">Опыт</a>
          <a href="#skills">Навыки</a>
          <a href="#contacts">GitHub</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section panel-chrome">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Digital Presence / 2026</p>
              <h1>{PROFILE.title}</h1>
              <p className="hero-lead">{PROFILE.summary}</p>

              <div className="hero-actions">
                <a className="button-link primary" href="#projects">
                  Смотреть проекты
                </a>
                <a className="button-link" href={PROFILE.githubUrl} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </div>

              <div className="hero-stats">
                <article className="stat-tile panel-chrome">
                  <span>Всего проектов</span>
                  <strong>{projects.length}</strong>
                </article>
                <article className="stat-tile panel-chrome">
                  <span>Активных</span>
                  <strong>{activeProjectsCount}</strong>
                </article>
                <article className="stat-tile panel-chrome">
                  <span>Последний апдейт</span>
                  <strong>{newestUpdate}</strong>
                </article>
              </div>
            </div>

            <aside className="hero-signal panel-chrome">
              <p className="signal-label">Signal Board</p>
              <h3>Current Focus</h3>
              <p>
                Современные UI, интерактивные интерфейсы и продуктовые решения с инженерной дисциплиной.
              </p>
              <div className="tag-row">
                {keyStacks.length === 0
                  ? '—'
                  : keyStacks.map((stack) => (
                      <span key={`stack-${stack}`} className="chip tech">
                        {stack}
                      </span>
                    ))}
              </div>
            </aside>
          </div>
        </section>

        <RevealSection
          id="projects"
          title="Проекты"
          subtitle="Автоматическая витрина из GitHub API с фильтрацией, статусами и модалками"
        >
          <div className="projects-toolbar">
            <div className="chip-list">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`chip ${activeCategory === filter ? 'active' : ''}`}
                  onClick={() => setActiveCategory(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="toolbar-meta panel-chrome">
              <span>Показано: {visibleProjects.length}</span>
              <span>Сортировка: last updated</span>
            </div>
          </div>

          {visibleProjects.length === 0 ? (
            <div className="empty-state panel-chrome">
              <h3>Пока нет проектов в локальном кэше</h3>
              <p>
                Запусти синк из GitHub API (`npm run sync:projects`) или дождись CI-синхронизации на
                следующем push в `main`.
              </p>
            </div>
          ) : (
            <div className="project-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={setSelectedProject} />
              ))}
            </div>
          )}
        </RevealSection>

        <RevealSection
          id="experience"
          title="Опыт"
          subtitle="Роли и достижения, где дизайн и разработка работают как единая система"
        >
          <div className="experience-list">
            {visibleExperience.map((item, index) => (
              <article key={`${item.title}-${item.period}`} className="experience-step panel-chrome">
                <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <div className="experience-head">
                    <h3>{item.title}</h3>
                    <span>{item.period}</span>
                  </div>
                  <ul>
                    {item.highlights.map((highlight) => (
                      <li key={`${item.title}-${highlight}`}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {EXPERIENCE_ITEMS.length > EXPERIENCE_PREVIEW_COUNT ? (
            <button
              type="button"
              className="button-link expand-button"
              onClick={() => setShowAllExperience((prev) => !prev)}
            >
              {showAllExperience ? 'Скрыть часть опыта' : 'Показать еще'}
            </button>
          ) : null}
        </RevealSection>

        <RevealSection id="skills" title="Навыки" subtitle="Ключевые направления, стек и практики реализации">
          <div className="skills-grid">
            {SKILL_GROUPS.map((group) => (
              <article key={group.category} className="skill-card panel-chrome">
                <div className="skill-head">
                  <h3>{group.category}</h3>
                  <span>{group.skills.length} items</span>
                </div>
                <div className="tag-row">
                  {group.skills.map((skill) => (
                    <span key={`${group.category}-${skill}`} className="chip tech">
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection
          id="contacts"
          title="Контакты"
          subtitle="Основной канал связи и полный список публичных репозиториев"
        >
          <div className="contact-panel panel-chrome">
            <p>Открыт к общению, коллаборациям и техническому обсуждению проектов.</p>
            <a className="button-link primary" href={PROFILE.githubUrl} target="_blank" rel="noreferrer">
              Перейти в GitHub
            </a>
          </div>
        </RevealSection>
      </main>

      <footer className="site-footer">
        <p>
          Cache timestamp: {new Date(cache.generatedAt).toLocaleString('ru-RU')} · source: {cache.source}
        </p>
      </footer>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}

export default App;
