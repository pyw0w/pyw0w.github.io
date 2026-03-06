import type { ExperienceItem, SkillGroup } from '../../types';
import { RevealSection } from '../ui/RevealSection';

interface ExpertiseSectionProps {
  experience: ExperienceItem[];
  skillGroups: SkillGroup[];
}

export function ExpertiseSection({ experience, skillGroups }: ExpertiseSectionProps) {
  return (
    <RevealSection
      id="expertise"
      eyebrow="Экспертиза"
      title="Плотный visual thinking, сильный frontend и привычка доводить идею до работающей системы."
      subtitle="Работаю на стыке арт-дирекции, интерфейсного дизайна и инженерии, поэтому умею держать и образ, и производственный ритм."
    >
      <div className="expertise-layout">
        <div className="experience-column">
          {experience.map((item) => (
            <article key={`${item.title}-${item.period}`} className="experience-card">
              <div className="experience-meta">
                <span>{item.period}</span>
                <h3>{item.title}</h3>
              </div>
              <ul>
                {item.highlights.map((highlight) => (
                  <li key={`${item.title}-${highlight}`}>{highlight}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="skills-column">
          {skillGroups.map((group) => (
            <article key={group.category} className="skill-cluster">
              <div className="skill-cluster-head">
                <h3>{group.category}</h3>
                <span>{group.skills.length}</span>
              </div>
              <div className="tag-row">
                {group.skills.map((skill) => (
                  <span key={`${group.category}-${skill}`} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
