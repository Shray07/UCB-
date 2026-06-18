import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 40,
  duration = 0.7,
  stagger = 0.1,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const childElements = el.children.length > 1 ? Array.from(el.children) : [el];

    gsap.set(childElements, { opacity: 0, y });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(childElements, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [delay, y, duration, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
