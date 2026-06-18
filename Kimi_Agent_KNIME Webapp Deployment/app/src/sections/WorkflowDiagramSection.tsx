import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { workflowNodes, phases } from '@/data/workflowNodes';
import ScrollReveal from '@/components/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

// Node positions for the 5-phase vertical diagram
const getNodePosition = (phaseIndex: number, nodeIndex: number, totalInPhase: number) => {
  const centerX = 450;
  if (phaseIndex === 0) { // Ingestion (3 nodes)
    const offset = (totalInPhase - 1) * 140;
    return { x: centerX - offset / 2 + nodeIndex * 140, y: 50 };
  }
  if (phaseIndex === 1) { // Classification (4 nodes)
    const offset = (totalInPhase - 1) * 140;
    return { x: centerX - offset / 2 + nodeIndex * 140, y: 160 };
  }
  if (phaseIndex === 2) { // String 1 (Receiver, 2 nodes)
    return { x: centerX - 180, y: 280 + nodeIndex * 70 };
  }
  if (phaseIndex === 3) { // String 2 (Donor, 4 nodes)
    return { x: centerX + 180, y: 280 + nodeIndex * 70 };
  }
  if (phaseIndex === 4) { // Output (3 nodes)
    const offset = (totalInPhase - 1) * 140;
    return { x: centerX - offset / 2 + nodeIndex * 140, y: 610 };
  }
  return { x: centerX, y: 100 };
};

export default function WorkflowDiagramSection() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll('.connection-path');
    const nodes = svg.querySelectorAll('.diagram-node');
    const labels = svg.querySelectorAll('.phase-label');

    // Set initial states
    gsap.set(paths, { strokeDasharray: 200, strokeDashoffset: 200, opacity: 0 });
    gsap.set(nodes, { opacity: 0, scale: 0.9 });
    gsap.set(labels, { opacity: 0, x: -20 });

    // Create timeline triggered by scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: svg,
        start: 'top 70%',
        once: true,
      },
    });

    // Animate each phase sequentially
    phases.forEach((_, phaseIdx) => {
      const phaseNodes = svg.querySelectorAll(`.diagram-node[data-phase="${phaseIdx}"]`);
      const phaseLabel = labels[phaseIdx];
      const phasePaths = svg.querySelectorAll(`.connection-path[data-phase="${phaseIdx}"]`);

      if (phaseLabel) {
        tl.to(phaseLabel, { opacity: 1, x: 0, duration: 0.3 }, phaseIdx * 0.25);
      }
      if (phaseNodes.length > 0) {
        tl.to(phaseNodes, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.05 }, phaseIdx * 0.25 + 0.1);
      }
      if (phasePaths.length > 0) {
        tl.to(phasePaths, { strokeDashoffset: 0, opacity: 1, duration: 0.5, ease: 'power2.inOut', stagger: 0.1 }, phaseIdx * 0.25 + 0.15);
      }
    });

    return () => { tl.kill(); };
  }, []);

  // Build phase-based node grouping
  const nodesByPhase = phases.map((phase) =>
    workflowNodes.filter((n) => n.phase === phase.id)
  );

  return (
    <section id="workflow" className="bg-[#F5F1EB] py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollReveal className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-3xl lg:text-5xl text-[#1B4332]">
            Complete Workflow Architecture
          </h2>
          <p className="font-body text-base text-[#2D3436]/60 mt-3">
            Visual map of the full 16-node KNIME automation pipeline
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="overflow-x-auto">
            <svg
              ref={svgRef}
              width="900"
              height="700"
              viewBox="0 0 900 700"
              className="mx-auto"
              style={{ minWidth: 700 }}
            >
              {/* Phase backgrounds */}
              {/* Phase 1 (Ingestion) */}
              <rect x="10" y="20" width="880" height="60" rx="8" fill="white" opacity="0.5" stroke="rgba(27,67,50,0.05)" />
              {/* Phase 2 (Aggregation & Classification) */}
              <rect x="10" y="130" width="880" height="60" rx="8" fill="white" opacity="0.5" stroke="rgba(27,67,50,0.05)" />
              {/* Phase 3 (String 1: Receiver) */}
              <rect x="10" y="250" width="430" height="150" rx="8" fill="white" opacity="0.5" stroke="rgba(27,67,50,0.05)" />
              {/* Phase 4 (String 2: Donor) */}
              <rect x="460" y="250" width="430" height="290" rx="8" fill="white" opacity="0.5" stroke="rgba(27,67,50,0.05)" />
              {/* Phase 5 (Merge & Output) */}
              <rect x="10" y="580" width="880" height="60" rx="8" fill="white" opacity="0.5" stroke="rgba(27,67,50,0.05)" />

              {/* Phase labels */}
              {phases.map((phase, i) => {
                const xPos = (i === 3) ? 470 : 20;
                const yPos = (i === 0) ? 35 : (i === 1) ? 145 : (i === 2 || i === 3) ? 265 : 595;
                return (
                  <g key={`label-${phase.id}`} className="phase-label">
                    <rect x={xPos} y={yPos - 12} width={phase.name.length * 6.8 + 20} height="22" rx="11" fill="#52796F" />
                    <text x={xPos + 10} y={yPos + 3} fontSize="11" fill="white" fontFamily="Inter" fontWeight="500">
                      {phase.name}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodesByPhase.map((nodes, phaseIdx) =>
                nodes.map((node, nodeIdx) => {
                  const pos = getNodePosition(phaseIdx, nodeIdx, nodes.length);
                  return (
                    <g key={node.id} className="diagram-node" data-phase={phaseIdx} data-cursor-hover>
                      <rect
                        x={pos.x - 55}
                        y={pos.y - 16}
                        width="110"
                        height="32"
                        rx="8"
                        fill="white"
                        stroke="rgba(27,67,50,0.15)"
                        strokeWidth="1"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(27,67,50,0.06))' }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontFamily="Inter"
                        fontWeight="500"
                        fill="#1B4332"
                      >
                        {node.name.length > 16 ? node.name.slice(0, 14) + '..' : node.name}
                      </text>
                    </g>
                  );
                })
              )}

              {/* Connection lines */}
              {/* Phase 1 sequential flow: Node 1 -> Node 2 -> Node 3 */}
              <path className="connection-path" data-phase="0" d="M 365 50 L 395 50" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="0" d="M 505 50 L 535 50" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Phase 1 to Phase 2 (Math Formula to GroupBy): Node 3 -> Node 4 */}
              <path className="connection-path" data-phase="1" d="M 590 66 Q 590 105 415 105 T 240 144" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Phase 2 sequential flow: Node 4 -> Node 5 -> Node 6 -> Node 7 */}
              <path className="connection-path" data-phase="1" d="M 295 160 L 325 160" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="1" d="M 435 160 L 465 160" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="1" d="M 575 160 L 605 160" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Phase 2 to Phase 3 & 4 (Rule Engine 3 splits to Node 8 and Node 10) */}
              {/* Split to Node 8 (Receiver Row Filter, left column) */}
              <path className="connection-path" data-phase="2" d="M 660 176 C 660 220, 270 220, 270 264" stroke="#84A98C" strokeWidth="2" fill="none" />
              {/* Split to Node 10 (Donor Row Filter, right column) */}
              <path className="connection-path" data-phase="3" d="M 660 176 C 660 220, 630 220, 630 264" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Split indicator */}
              <g transform="translate(660, 220)">
                <circle r="6" fill="#52796F" opacity="0.15" />
                <path d="M 0 -3 L -2.5 1.5 L 2.5 1.5 Z" fill="#52796F" transform="rotate(180)" />
              </g>

              {/* String 1 sequential flow: Node 8 -> Node 9 */}
              <path className="connection-path" data-phase="2" d="M 270 296 L 270 334" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* String 2 sequential flow: Node 10 -> Node 11 -> Node 12 -> Node 13 */}
              <path className="connection-path" data-phase="3" d="M 630 296 L 630 334" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="3" d="M 630 366 L 630 404" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="3" d="M 630 436 L 630 474" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Phase 3 & 4 merging to Phase 5 (Node 9 & Node 13 merge to Joiner Node 14) */}
              {/* Node 9 (left) to Node 14 */}
              <path className="connection-path" data-phase="4" d="M 270 366 C 270 550, 310 550, 310 594" stroke="#84A98C" strokeWidth="2" fill="none" />
              {/* Node 13 (right) to Node 14 */}
              <path className="connection-path" data-phase="4" d="M 630 506 C 630 550, 310 550, 310 594" stroke="#84A98C" strokeWidth="2" fill="none" />

              {/* Merge indicator */}
              <g transform="translate(310, 550)">
                <circle r="6" fill="#52796F" opacity="0.15" />
                <path d="M -3 -1.5 L 0 1.5 L 3 -1.5" fill="none" stroke="#52796F" strokeWidth="1.5" />
              </g>

              {/* Phase 5 sequential flow: Node 14 -> Node 15 -> Node 16 */}
              <path className="connection-path" data-phase="4" d="M 365 610 L 395 610" stroke="#84A98C" strokeWidth="2" fill="none" />
              <path className="connection-path" data-phase="4" d="M 505 610 L 535 610" stroke="#84A98C" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
