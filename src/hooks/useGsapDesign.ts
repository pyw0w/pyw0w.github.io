import { RefObject, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapDesign(scopeRef: RefObject<HTMLElement | null>, deps: ReadonlyArray<unknown>) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const isMobile = window.matchMedia('(max-width: 920px)').matches;

    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

      intro
        .from('.site-header', { y: -22, opacity: 0, duration: 0.6 })
        .from('.hero .eyebrow', { y: 12, opacity: 0, duration: 0.42 }, '-=0.25')
        .from('.hero h1', { y: 20, opacity: 0, duration: 0.62 }, '-=0.2')
        .from('.hero p', { y: 16, opacity: 0, duration: 0.52 }, '-=0.38')
        .from('.hero-actions > *', { y: 14, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.3');

      gsap.utils.toArray<HTMLElement>('.gsap-section').forEach((section) => {
        gsap.from(section, {
          y: 34,
          opacity: 0,
          duration: 0.72,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('.project-card, .experience-item, .skill-card').forEach((item, index) => {
        gsap.from(item, {
          y: 18,
          opacity: 0,
          duration: 0.52,
          delay: (index % 8) * 0.03,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.to('.scene-layer', {
        yPercent: isMobile ? -2 : -6,
        scale: isMobile ? 1.02 : 1.07,
        ease: 'none',
        scrollTrigger: {
          trigger: 'main',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
        },
      });
    }, scope);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, deps);
}
