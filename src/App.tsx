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
  useGsapDesign(appRef, [activeCategory, visibleProjects.length, showAllExperience]);

  return (
    <div ref={appRef} className="app-shell">
      <AdaptiveScene />

      <header className="site-header">
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
        <section className="hero section">
          <div className="hero-content">
            <p className="eyebrow">Личный инфо-сайт</p>
            <h1>{PROFILE.title}</h1>
            <p>{PROFILE.summary}</p>
            <div className="hero-actions">
              <a className="button-link primary" href="#projects">
                Смотреть проекты
              </a>
              <a className="button-link" href={PROFILE.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </section>

        <RevealSection
          id="projects"
          title="Проекты"
          subtitle="Автоматически синхронизируются из GitHub API и сортируются по последнему обновлению"
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
            <p className="meta-text">Показано проектов: {visibleProjects.length}</p>
          </div>

          {visibleProjects.length === 0 ? (
            <div className="empty-state">
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
          subtitle="Фокус на ролях и достижениях с приоритетом реального impact"
        >
          <div className="experience-list">
            {visibleExperience.map((item) => (
              <article key={`${item.title}-${item.period}`} className="experience-item">
                <div className="experience-head">
                  <h3>{item.title}</h3>
                  <span>{item.period}</span>
                </div>
                <ul>
                  {item.highlights.map((highlight) => (
                    <li key={`${item.title}-${highlight}`}>{highlight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {EXPERIENCE_ITEMS.length > EXPERIENCE_PREVIEW_COUNT ? (
            <button
              type="button"
              className="button-link"
              onClick={() => setShowAllExperience((prev) => !prev)}
            >
              {showAllExperience ? 'Скрыть часть опыта' : 'Показать еще'}
            </button>
          ) : null}
        </RevealSection>

        <RevealSection id="skills" title="Навыки" subtitle="Сгруппированы по ключевым направлениям">
          <div className="skills-grid">
            {SKILL_GROUPS.map((group) => (
              <article key={group.category} className="skill-card">
                <h3>{group.category}</h3>
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
          subtitle="Для связи и просмотра полного списка проектов"
        >
          <a className="button-link primary" href={PROFILE.githubUrl} target="_blank" rel="noreferrer">
            Перейти в GitHub
          </a>
        </RevealSection>
      </main>

      <footer className="site-footer">
        <p>
          Кэш проектов: {new Date(cache.generatedAt).toLocaleString('ru-RU')} ({cache.source})
        </p>
      </footer>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}

export default App;
