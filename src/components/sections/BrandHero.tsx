import type { HeroMetric } from '../../types';

interface BrandHeroProps {
  name: string;
  title: string;
  summary: string;
  manifesto: string;
  availability: string;
  metrics: HeroMetric[];
  primaryLink: string;
}

export function BrandHero({
  name,
  title,
  summary,
  manifesto,
  availability,
  metrics,
  primaryLink,
}: BrandHeroProps) {
  return (
    <section id="top" className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">Personal Brand / Editorial Portfolio / 2026</p>
        <h1 className="hero-title">
          <span className="hero-title-line">{title}</span>
        </h1>
        <p className="hero-summary">{summary}</p>

        <div className="hero-actions">
          <a className="button-link primary" href="#cases">
            Избранные кейсы
          </a>
          <a className="button-link" href={primaryLink} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>

        <div className="hero-metrics">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </div>

      <aside className="hero-note">
        <p className="hero-note-label">Манифест</p>
        <p className="hero-note-copy">{manifesto}</p>

        <div className="hero-portrait">
          <div className="portrait-stack">
            <span className="portrait-name">{name}</span>
            <span className="portrait-status">{availability}</span>
          </div>
          <p className="portrait-footnote">
            Делаю сайты, интерфейсы и визуальные системы, которые удерживают внимание и не теряют
            инженерную точность.
          </p>
        </div>
      </aside>
    </section>
  );
}
