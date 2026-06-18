import { useState, useEffect } from 'react';
import { workflowNodes } from '@/data/workflowNodes';
import NodeIcon from '@/components/NodeIcon';
import ScrollReveal from '@/components/ScrollReveal';

export default function NodeExplorerSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    workflowNodes.forEach((_, i) => {
      const el = document.getElementById(`node-card-${i}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(i);
          }
        },
        { threshold: 0.5, rootMargin: '-40% 0px -40% 0px' }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section id="nodes" className="bg-[#F5F1EB] py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Sticky Text */}
          <div className="lg:w-[40%] lg:sticky lg:top-[120px] lg:self-start">
            <ScrollReveal>
              <h2 className="font-display text-3xl lg:text-5xl text-[#1B4332]">
                16 Nodes, One Workflow
              </h2>
              <p className="font-body text-base text-[#2D3436]/70 mt-4 leading-relaxed">
                Every node in the KNIME chain serves a precise purpose — from data ingestion to
                final output. Explore each node's role in the automation pipeline.
              </p>
              <div className="mt-6 font-body font-semibold text-sm text-[#52796F]">
                {String(activeIndex + 1).padStart(2, '0')} / 16
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column - Scrollable Node List */}
          <div className="lg:w-[60%] flex flex-col gap-4">
            {workflowNodes.map((node, i) => {
              const isActive = activeIndex === i;
              return (
                <ScrollReveal key={node.id} delay={i * 0.03} y={20}>
                  <div
                    id={`node-card-${i}`}
                    className={`flex items-center gap-4 bg-white rounded-xl p-5 lg:p-6 border transition-all duration-300 ${
                      isActive
                        ? 'border-[#52796F] border-[1.5px] shadow-sm'
                        : 'border-[rgba(27,67,50,0.1)]'
                    }`}
                    style={{
                      borderLeft: isActive ? '3px solid #E29578' : '3px solid transparent',
                    }}
                  >
                    <span
                      className={`font-display text-xl lg:text-2xl transition-colors duration-300 ${
                        isActive ? 'text-[#52796F]' : 'text-[#84A98C]'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-semibold text-sm lg:text-base text-[#1B4332]">
                        {node.name}
                      </div>
                      <div className="font-body text-xs lg:text-sm text-[#2D3436]/60">
                        {node.type}
                      </div>
                    </div>
                    <NodeIcon
                      name={node.icon}
                      className={`w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 ${
                        isActive ? 'text-[#52796F]' : 'text-[#84A98C]'
                      }`}
                    />
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
