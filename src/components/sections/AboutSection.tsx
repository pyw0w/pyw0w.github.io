import type { Principle } from '../../types';
import { RevealSection } from '../ui/RevealSection';

interface AboutSectionProps {
  intro: string;
  principles: Principle[];
}

export function AboutSection({ intro, principles }: AboutSectionProps) {
  return (
    <RevealSection
      id="about"
      eyebrow="Подход"
      title="Строю digital-образы так, чтобы визуальная идея и production-код работали как одна система."
      subtitle={intro}
    >
      <div className="principles-grid">
        {principles.map((principle) => (
          <article key={principle.title} className="principle-card">
            <h3>{principle.title}</h3>
            <p>{principle.description}</p>
          </article>
        ))}
      </div>
    </RevealSection>
  );
}
