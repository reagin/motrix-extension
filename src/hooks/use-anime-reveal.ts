import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export function useAnimeReveal<T extends HTMLElement>(enabled: boolean, dependency: unknown = 'mount') {
  const ref = useRef<T | null>(null);
  const lastRunRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (lastRunRef.current === dependency) return;
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return;
    const targets = ref.current.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    lastRunRef.current = dependency;
    animate(targets, {
      opacity: [0, 1],
      translateY: [6, 0],
      delay: stagger(35),
      duration: 220,
      ease: 'outQuad',
    });
  }, [enabled, dependency]);
  return ref;
}
