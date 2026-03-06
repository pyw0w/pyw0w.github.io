import type { ReactNode } from 'react';

interface RevealSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function RevealSection({ id, eyebrow, title, subtitle, children }: RevealSectionProps) {
  return (
    <section id={id} className="reveal-section">
      <header className="section-head">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
