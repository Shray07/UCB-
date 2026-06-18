import { Award, UserCog, CheckCircle } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const ruleEngines = [
  {
    icon: Award,
    title: 'Performance Classifier',
    subtitle: 'Rule Engine 1: Performance',
    logic: `$Mean(Sell Through)$ >= 60 => "Good Performer"\nTRUE => "Poor Performer"`,
    description:
      'Categorizes every store as either a good or poor performer based on sell-through rate.',
  },
  {
    icon: UserCog,
    title: 'Role Assignment',
    subtitle: 'Rule Engine 2: Role Assignment',
    logic: `$Mean(Sell Through)$ >= 60 => "Receiver"\n$Mean(Sell Through)$ <= 40 => "Doner"\nTRUE => "Neutral"`,
    description:
      'Assigns donor, receiver, or neutral roles based on performance thresholds.',
  },
  {
    icon: CheckCircle,
    title: 'Final Allocation',
    subtitle: 'Rule Engine 3: Final Allocation',
    logic: `$Doner/Recever Status$ = "Receiver" AND ($Current Stock$ < $pcs req$) => "Receiver"\n$Doner/Recever Status$ = "Receiver" AND ($Current Stock$ >= $pcs req$) => "Neutral"\n$Doner/Recever Status$ = "Doner" => "Doner"\nTRUE => "Neutral"`,
    description:
      'Final verification ensures accurate allocation before output generation.',
  },
];

export default function LogicVisualizationSection() {
  return (
    <section className="bg-[#1B4332] py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollReveal className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-3xl lg:text-5xl text-white">
            The Logic Behind the Automation
          </h2>
          <p className="font-body text-base text-white/60 mt-3">
            Three rule engines make the decisions that drive intelligent inventory allocation
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
          {ruleEngines.map((rule, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="bg-white/[0.08] border border-white/[0.15] rounded-2xl p-6 lg:p-8 h-full">
                <rule.icon className="w-8 h-8 text-[#E29578] mb-4" />
                <p className="font-body text-xs text-[#84A98C] mb-1">{rule.subtitle}</p>
                <h3 className="font-body font-semibold text-lg text-white mb-4">
                  {rule.title}
                </h3>
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <pre className="font-mono text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                    {rule.logic}
                  </pre>
                </div>
                <p className="font-body text-sm text-white/50 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
