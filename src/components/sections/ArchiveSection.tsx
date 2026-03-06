import type { Project } from '../../types';
import { RevealSection } from '../ui/RevealSection';

interface ArchiveSectionProps {
  projects: Project[];
  githubUrl: string;
}

export function ArchiveSection({ projects, githubUrl }: ArchiveSectionProps) {
  return (
    <RevealSection
      id="archive"
      eyebrow="Архив"
      title="Остальные репозитории оставляю как бэкстейдж: они показывают ширину интересов, но не спорят с основным narrative."
      subtitle="Автоматическая GitHub-лента живёт как слой доверия и глубины, а не как главный экран."
    >
      {projects.length === 0 ? (
        <div className="archive-empty">
          <p>Локальный архив пока пуст. После следующей синхронизации здесь появятся свежие репозитории.</p>
          <a className="button-link" href={githubUrl} target="_blank" rel="noreferrer">
            Смотреть профиль на GitHub
          </a>
        </div>
      ) : (
        <div className="archive-grid">
          {projects.map((project) => (
            <article key={project.id} className="archive-card">
              <div className="archive-card-head">
                <h3>{project.name}</h3>
                <span>{new Date(project.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <p>{project.description}</p>
              <div className="tag-row">
                {project.categories.map((category) => (
                  <span key={`${project.id}-${category}`} className="chip muted">
                    {category}
                  </span>
                ))}
              </div>
              <div className="archive-card-footer">
                <span>⭐ {project.stars}</span>
                <a href={project.repoUrl} target="_blank" rel="noreferrer">
                  Открыть
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </RevealSection>
  );
}
