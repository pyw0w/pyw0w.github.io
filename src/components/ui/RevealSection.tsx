import type { ReactNode } from 'react';

interface RevealSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function RevealSection({ id, title, subtitle, children }: RevealSectionProps) {
  return (
    <section id={id} className="section gsap-section">
      <header className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
