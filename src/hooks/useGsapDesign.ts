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
        .from('.site-header', { y: -24, autoAlpha: 0, duration: 0.6 })
        .from('.hero-kicker', { y: 12, autoAlpha: 0, duration: 0.35 }, '-=0.28')
        .from('.hero-title-line', { yPercent: 100, autoAlpha: 0, duration: 0.7 }, '-=0.06')
        .from('.hero-summary', { y: 18, autoAlpha: 0, duration: 0.5 }, '-=0.36')
        .from('.hero-actions > *', { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.08 }, '-=0.26')
        .from('.metric-card', { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.07 }, '-=0.28')
        .from('.hero-note', { x: 28, autoAlpha: 0, duration: 0.6 }, '-=0.5');

      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.from(section, {
          y: 42,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 84%',
            once: true,
          },
        });
      });

      const items = gsap.utils.toArray<HTMLElement>(
        '.principle-card, .case-card, .experience-card, .skill-cluster, .archive-card, .contact-card',
      );

      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 18,
            autoAlpha: 0,
            duration: 0.5,
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
