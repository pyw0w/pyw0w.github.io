import { useMemo, useRef } from 'react';
import { ArchiveSection } from './components/sections/ArchiveSection';
import { AboutSection } from './components/sections/AboutSection';
import { BrandHero } from './components/sections/BrandHero';
import { ContactSection } from './components/sections/ContactSection';
import { ExpertiseSection } from './components/sections/ExpertiseSection';
import { FeaturedCasesSection } from './components/sections/FeaturedCasesSection';
import { MobileMenu } from './components/ui/MobileMenu';
import projectsCache from './data/cache/projects.json';
import {
  CONTACT_LINKS,
  EXPERIENCE_ITEMS,
  FEATURED_CASES,
  HERO_METRICS,
  PRINCIPLES,
  PROFILE,
  SKILL_GROUPS,
} from './data/profile';
import { useGsapDesign } from './hooks/useGsapDesign';
import type { Project, ProjectsCache } from './types';

function sortByUpdatedDesc(items: Project[]) {
  return [...items].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function App() {
  const appRef = useRef<HTMLDivElement | null>(null);
  const cache = projectsCache as ProjectsCache;
  const projects = useMemo(() => sortByUpdatedDesc(cache.projects), [cache.projects]);
  const archiveProjects = useMemo(() => projects.slice(0, 6), [projects]);
  const cacheTimestamp =
    cache.generatedAt === '1970-01-01T00:00:00.000Z'
      ? 'архив ещё не синхронизирован'
      : new Date(cache.generatedAt).toLocaleString('ru-RU');

  useGsapDesign(appRef, [archiveProjects.length]);

  return (
    <div ref={appRef} className="app-shell">
      <div className="page-glow page-glow-left" aria-hidden />
      <div className="page-glow page-glow-right" aria-hidden />
      <div className="page-grid" aria-hidden />

      <header className="site-header">
        <a className="logo" href="#top">
          {PROFILE.name}
        </a>
        <nav className="desktop-nav">
          <a href="#about">Подход</a>
          <a href="#cases">Кейсы</a>
          <a href="#archive">Архив</a>
          <a href="#contact">Контакт</a>
        </nav>
        <div className="header-end">
          <a className="header-cta" href={PROFILE.githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <MobileMenu githubUrl={PROFILE.githubUrl} />
        </div>
      </header>

      <main>
        <BrandHero
          name={PROFILE.name}
          title={PROFILE.title}
          summary={PROFILE.summary}
          manifesto={PROFILE.manifesto}
          availability={PROFILE.availability}
          metrics={HERO_METRICS}
          primaryLink={PROFILE.githubUrl}
        />
        <AboutSection intro={PROFILE.intro} principles={PRINCIPLES} />
        <FeaturedCasesSection cases={FEATURED_CASES} />
        <ExpertiseSection experience={EXPERIENCE_ITEMS} skillGroups={SKILL_GROUPS} />
        <ArchiveSection projects={archiveProjects} githubUrl={PROFILE.githubUrl} />
        <ContactSection summary={PROFILE.contactSummary} contacts={CONTACT_LINKS} />
      </main>

      <footer className="site-footer">
        <p>Архив GitHub: {cacheTimestamp}</p>
        <p>Источник данных: {cache.source}</p>
      </footer>
    </div>
  );
}

export default App;
