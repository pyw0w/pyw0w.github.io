import { useEffect } from 'react';
import type { Project } from '../types';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'Активный',
  maintenance: 'Поддержка',
};

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, onClose]);

  if (!project) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="project-modal-top">
          <h3 id="project-modal-title">{project.name}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <p>{project.description}</p>

        <div className="modal-grid">
          <div>
            <h4>Статус</h4>
            <p>
              <span className={`status-tag ${project.status}`}>{STATUS_LABEL[project.status]}</span>
            </p>
          </div>
          <div>
            <h4>Последнее обновление</h4>
            <p>{new Date(project.updatedAt).toLocaleString('ru-RU')}</p>
          </div>
        </div>

        <h4>Категории</h4>
        <div className="tag-row">
          {project.categories.map((category) => (
            <span key={`modal-category-${category}`} className="chip muted">
              {category}
            </span>
          ))}
        </div>

        <h4>Технологии</h4>
        <div className="tag-row">
          {project.techStack.map((tech) => (
            <span key={`modal-tech-${tech}`} className="chip tech">
              {tech}
            </span>
          ))}
        </div>

        <div className="modal-actions">
          <a className="button-link primary" href={project.repoUrl} target="_blank" rel="noreferrer">
            Открыть GitHub
          </a>
          {project.demoUrl ? (
            <a className="button-link" href={project.demoUrl} target="_blank" rel="noreferrer">
              Демо
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
