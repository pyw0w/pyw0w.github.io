import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
}

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'Активный',
  maintenance: 'Поддержка',
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <button type="button" className="project-card panel-chrome" onClick={() => onOpen(project)}>
      <div className="project-card-top">
        <h3>{project.name}</h3>
        <span className={`status-tag ${project.status}`}>{STATUS_LABEL[project.status]}</span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="tag-row">
        {project.categories.map((category) => (
          <span key={`${project.id}-${category}`} className="chip muted">
            {category}
          </span>
        ))}
      </div>

      <div className="tag-row tech-row">
        {project.techStack.slice(0, 5).map((tech) => (
          <span key={`${project.id}-${tech}`} className="chip tech">
            {tech}
          </span>
        ))}
      </div>

      <div className="project-card-footer">
        <span>updated {new Date(project.updatedAt).toLocaleDateString('ru-RU')}</span>
        <span>⭐ {project.stars}</span>
      </div>
    </button>
  );
}
