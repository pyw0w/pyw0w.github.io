import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function RevealSection({ id, title, subtitle, children }: RevealSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={containerRef} className={`section reveal${visible ? ' is-visible' : ''}`}>
      <header className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
