import { Link } from 'react-router';
import ScrollReveal from '@/components/ScrollReveal';

export default function CTASection() {
  return (
    <section className="bg-[#1B4332] py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <ScrollReveal>
          <h2 className="font-display text-3xl lg:text-5xl text-white">
            Ready to Automate Your Replenishment?
          </h2>
          <p className="font-body text-base text-white/60 mt-4 max-w-[600px] mx-auto">
            Explore the full workflow in the Dashboard or dive deeper into each node's logic.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-white text-[#1B4332] font-body font-medium text-base hover:bg-white/90 transition-colors"
              data-cursor-hover
            >
              View Dashboard
            </Link>
            <a
              href="#nodes"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('nodes')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center px-8 py-3.5 rounded-full border-[1.5px] border-white text-white font-body font-medium text-base hover:bg-white/10 transition-colors"
              data-cursor-hover
            >
              Learn More
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
