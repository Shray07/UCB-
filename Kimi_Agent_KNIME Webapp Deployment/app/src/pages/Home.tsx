import HeroSection from '@/sections/HeroSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import NodeExplorerSection from '@/sections/NodeExplorerSection';
import LogicVisualizationSection from '@/sections/LogicVisualizationSection';
import ImpactMetricsSection from '@/sections/ImpactMetricsSection';
import WorkflowDiagramSection from '@/sections/WorkflowDiagramSection';
import CTASection from '@/sections/CTASection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <NodeExplorerSection />
      <LogicVisualizationSection />
      <ImpactMetricsSection />
      <WorkflowDiagramSection />
      <CTASection />
    </main>
  );
}
