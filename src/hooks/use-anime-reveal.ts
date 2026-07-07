import { animate, stagger } from 'animejs';
import { useLayoutEffect, useRef } from 'react';

export function useAnimeReveal<T extends HTMLElement>(enabled: boolean, dependency: unknown = 'mount') {
  const ref = useRef<T | null>(null);
  const lastRunRef = useRef<unknown>(undefined);

  useLayoutEffect(() => {
    if (lastRunRef.current === dependency) return;
    if (!ref.current) return;
    const targets = ref.current.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    lastRunRef.current = dependency;

    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((target) => {
        if (target instanceof HTMLElement) {
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
      return;
    }

    targets.forEach((target) => {
      if (target instanceof HTMLElement) {
        target.style.opacity = '0.001';
        target.style.transform = 'translateY(4px)';
      }
    });

    const frame = requestAnimationFrame(() => {
      animate(targets, {
        opacity: 1,
        translateY: 0,
        delay: stagger(24),
        duration: 160,
        ease: 'outQuad',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [enabled, dependency]);
  return ref;
}
