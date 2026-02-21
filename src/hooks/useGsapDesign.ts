import { RefObject, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapDesign(scopeRef: RefObject<HTMLElement | null>, refreshDeps: ReadonlyArray<unknown>) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

      intro
        .from('.site-header', { y: -22, autoAlpha: 0, duration: 0.55 })
        .from('.hero .eyebrow', { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.2')
        .from('.hero h1', { y: 18, autoAlpha: 0, duration: 0.6 }, '-=0.18')
        .from('.hero-lead', { y: 14, autoAlpha: 0, duration: 0.5 }, '-=0.32')
        .from('.hero-actions > *', { y: 12, autoAlpha: 0, duration: 0.35, stagger: 0.08 }, '-=0.3')
        .from('.stat-tile', { y: 12, autoAlpha: 0, duration: 0.35, stagger: 0.07 }, '-=0.25')
        .from('.hero-signal', { x: 22, autoAlpha: 0, duration: 0.5 }, '-=0.45');

      gsap.utils.toArray<HTMLElement>('.gsap-section').forEach((section) => {
        gsap.from(section, {
          y: 30,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 84%',
            once: true,
          },
        });
      });

      const items = gsap.utils.toArray<HTMLElement>(
        '.project-card, .experience-step, .skill-card, .contact-panel',
      );

      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 16,
            autoAlpha: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        },
      });
    }, scope);

    return () => {
      ctx.revert();
    };
  }, [scopeRef]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, refreshDeps);
}
