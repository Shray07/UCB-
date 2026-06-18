import { Database, Calculator, Merge } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const steps = [
  {
    icon: Database,
    title: 'Data Ingestion',
    description:
      'Excel Reader fetches local inventory data. Row Filter removes inactive stores with zero received quantity.',
  },
  {
    icon: Calculator,
    title: 'Smart Classification',
    description:
      'Math Formula computes Sell-Through rates. GroupBy aggregates by category. Three Rule Engines classify performers and assign donor/receiver roles.',
  },
  {
    icon: Merge,
    title: 'Allocation Output',
    description:
      'Data splits into Receiver and Donor streams, each processed and renamed. Joiner merges both into a final allocation table with rounded values.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollReveal className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-3xl lg:text-5xl text-[#1B4332]">
            From Raw Data to Smart Allocations
          </h2>
          <p className="font-body text-base text-[#2D3436]/60 mt-3">
            Three logical stages process your inventory through mathematical precision
          </p>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch max-w-[1000px] mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex items-center gap-4 lg:gap-0">
              <ScrollReveal
                className="flex-1 bg-white border border-[rgba(27,67,50,0.1)] rounded-2xl p-8 lg:p-10"
                delay={i * 0.1}
              >
                <step.icon className="w-8 h-8 text-[#52796F] mb-4" />
                <h3 className="font-body font-semibold text-lg text-[#1B4332] mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-[#2D3436]/70 leading-relaxed">
                  {step.description}
                </p>
              </ScrollReveal>

              {/* Connecting arrow between cards */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center w-12 flex-shrink-0">
                  <div className="w-12 h-[2px] bg-[#84A98C] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-[#84A98C] border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
