import { useEffect, useRef } from 'react';
import CountUp from 'react-countup';
import gsap from 'gsap';
import { useInView } from '@/hooks/useInView';

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  target,
  duration = 1.5,
  className = '',
  suffix = '',
}: AnimatedNumberProps) {
  const { ref, isInView } = useInView(0.3);
  const spanRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
    }
  }, [isInView]);

  const handleComplete = () => {
    if (spanRef.current) {
      gsap.fromTo(
        spanRef.current,
        { scale: 1 },
        { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
      );
    }
  };

  return (
    <span ref={ref}>
      {isInView ? (
        <CountUp
          start={0}
          end={target}
          duration={duration}
          onEnd={handleComplete}
        >
          {({ countUpRef }) => (
            <span ref={(el) => {
              (countUpRef as React.MutableRefObject<HTMLSpanElement | null>).current = el;
              (spanRef as React.MutableRefObject<HTMLSpanElement | null>).current = el;
            }} className={className}>
              {suffix}
            </span>
          )}
        </CountUp>
      ) : (
        <span ref={spanRef} className={className}>0{suffix}</span>
      )}
    </span>
  );
}
