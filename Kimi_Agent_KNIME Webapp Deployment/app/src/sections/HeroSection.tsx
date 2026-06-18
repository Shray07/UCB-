import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import NodeChainVisualization from '@/components/NodeChainVisualization';

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(headlineRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
      .fromTo(subtitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.4)
      .fromTo(ctaRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.6)
      .fromTo(statsRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.8);

    return () => { tl.kill(); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen bg-[#F5F1EB] flex items-center pt-16"
      style={{
        backgroundImage: 'url(/assets/hero-texture.jpg)',
        backgroundSize: '200px',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 w-full py-16 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Column - Text */}
          <div className="flex-1 lg:max-w-[60%]">
            <h1
              ref={headlineRef}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] text-[#1B4332] leading-[1.1] tracking-[-0.02em]"
              style={{ opacity: 0 }}
            >
              Automated Replenishment Intelligence
            </h1>
            <p
              ref={subtitleRef}
              className="font-body text-base lg:text-lg text-[#2D3436]/70 mt-6 max-w-[480px] leading-relaxed"
              style={{ opacity: 0 }}
            >
              A 16-node KNIME workflow that transforms raw inventory data into actionable donor-receiver allocations — fully automated, fully transparent.
            </p>

            {/* CTA Row */}
            <div ref={ctaRef} className="flex flex-wrap gap-4 mt-10" style={{ opacity: 0 }}>
              <a
                href="#workflow"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center px-7 py-3 rounded-full bg-[#52796F] text-white font-body font-medium text-base hover:bg-[#3d5c54] transition-colors"
                data-cursor-hover
              >
                Explore the Workflow
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-7 py-3 rounded-full border-[1.5px] border-[#52796F] text-[#52796F] font-body font-medium text-base hover:bg-[#52796F]/5 transition-colors"
                data-cursor-hover
              >
                View Dashboard
              </Link>
            </div>

            {/* Stats Row */}
            <div ref={statsRef} className="flex flex-wrap gap-8 lg:gap-12 mt-16" style={{ opacity: 0 }}>
              {[
                { number: '16', label: 'Nodes' },
                { number: '3', label: 'Rule Engines' },
                { number: '100%', label: 'Automated' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-3xl lg:text-4xl text-[#1B4332]">{stat.number}</div>
                  <div className="font-body text-sm text-[#2D3436]/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visualization */}
          <div className="hidden lg:flex lg:w-[40%] justify-center items-center">
            <NodeChainVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
