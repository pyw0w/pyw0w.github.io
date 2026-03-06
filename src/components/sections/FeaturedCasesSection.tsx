import type { FeaturedCase } from '../../types';
import { RevealSection } from '../ui/RevealSection';

interface FeaturedCasesSectionProps {
  cases: FeaturedCase[];
}

export function FeaturedCasesSection({ cases }: FeaturedCasesSectionProps) {
  return (
    <RevealSection
      id="cases"
      eyebrow="Избранное"
      title="Не просто проекты, а собранные сцены: контекст, роль, эффект и инженерная логика."
      subtitle="Сверху только те работы и направления, которые лучше всего показывают мой способ думать и собирать интерфейсы."
    >
      <div className="cases-grid">
        {cases.map((item) => (
          <article key={item.slug} className="case-card">
            <div className="case-meta">
              <span>{item.category}</span>
              <span>{item.year}</span>
            </div>

            <div className="case-body">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>

            <div className="case-details">
              <p>
                <strong>Роль</strong>
                <span>{item.role}</span>
              </p>
              <p>
                <strong>Результат</strong>
                <span>{item.outcome}</span>
              </p>
            </div>

            <div className="tag-row">
              {item.techStack.map((tech) => (
                <span key={`${item.slug}-${tech}`} className="chip tech">
                  {tech}
                </span>
              ))}
            </div>

            <div className="case-links">
              {item.links.map((link) => (
                <a key={`${item.slug}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </RevealSection>
  );
}
