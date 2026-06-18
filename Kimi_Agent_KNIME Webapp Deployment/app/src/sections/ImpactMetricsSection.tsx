import AnimatedNumber from '@/components/AnimatedNumber';
import ScrollReveal from '@/components/ScrollReveal';

const metrics = [
  { value: 16, label: 'Processing Nodes', sub: 'From data ingestion to final output' },
  { value: 3, label: 'Decision Engines', sub: 'Rule-based logic for smart classification' },
  { value: 2, label: 'Data Streams', sub: 'Separate Donor and Receiver processing paths' },
  { value: 1, label: 'Unified Output', sub: 'Single allocation table with rounded precision values' },
];

export default function ImpactMetricsSection() {
  return (
    <section id="impact" className="bg-white py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollReveal className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-3xl lg:text-5xl text-[#1B4332]">
            Transforming Inventory Management
          </h2>
          <p className="font-body text-base text-[#2D3436]/60 mt-3">
            Quantifiable improvements across every step of the replenishment process
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          {metrics.map((metric, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="bg-[#F5F1EB] rounded-2xl p-8 lg:p-10 text-center">
                <div className="font-display text-5xl lg:text-6xl text-[#1B4332]">
                  <AnimatedNumber target={metric.value} />
                </div>
                <div className="font-body font-medium text-base text-[#2D3436] mt-3">
                  {metric.label}
                </div>
                <div className="font-body text-sm text-[#2D3436]/50 mt-1">
                  {metric.sub}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
