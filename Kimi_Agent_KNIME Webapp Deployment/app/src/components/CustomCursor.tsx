import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Check for touch device
    if (window.matchMedia('(hover: none)').matches) {
      cursor.style.display = 'none';
      return;
    }

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.15, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.15, ease: 'power3.out' });

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const onMouseEnterInteractive = () => {
      if (isHovering.current) return;
      isHovering.current = true;
      gsap.to(cursor, {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(132, 169, 140, 0.1)',
        duration: 0.3,
        ease: 'power3.out',
      });
    };

    const onMouseLeaveInteractive = () => {
      isHovering.current = false;
      gsap.to(cursor, {
        width: 12,
        height: 12,
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power3.out',
      });
    };

    document.addEventListener('mousemove', onMouseMove);

    // Use event delegation for interactive elements
    const interactiveSelector = 'a, button, [data-cursor-hover], input, textarea, select';

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) {
        onMouseEnterInteractive();
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) {
        onMouseLeaveInteractive();
      }
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-[1.5px] border-[#52796F]"
      style={{
        width: 12,
        height: 12,
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
      }}
    />
  );
}
