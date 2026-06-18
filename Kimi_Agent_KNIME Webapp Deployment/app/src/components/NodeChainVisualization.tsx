import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { workflowNodes } from '@/data/workflowNodes';

// Node positions for the branching SVG layout
const nodePositions = [
  { x: 130, y: 20 },   // 1. Excel Reader
  { x: 130, y: 60 },   // 2. Row Filter
  { x: 130, y: 100 },  // 3. Math Formula
  { x: 130, y: 140 },  // 4. GroupBy
  { x: 130, y: 180 },  // 5. Rule Engine 1
  { x: 130, y: 220 },  // 6. Rule Engine 2
  { x: 130, y: 260 },  // 7. Rule Engine 3
  { x: 60, y: 310 },   // 8. Row Filter (S1) - left branch
  { x: 60, y: 350 },   // 9. Column Renamer (S1)
  { x: 200, y: 310 },  // 10. Row Filter (S2) - right branch
  { x: 200, y: 350 },  // 11. Sorter
  { x: 200, y: 390 },  // 12. Duplicate Row Filter
  { x: 200, y: 430 },  // 13. Column Renamer (S2)
  { x: 130, y: 480 },  // 14. Joiner
  { x: 130, y: 520 },  // 15. Number Rounder
  { x: 130, y: 560 },  // 16. GroupBy (Final)
];

// Connections: [fromIndex, toIndex]
const connections: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], // Phase 1-2 vertical
  [6, 7], [6, 9],   // Split to String 1 and String 2
  [7, 8],           // String 1 vertical
  [9, 10], [10, 11], [11, 12], // String 2 vertical
  [8, 13], [12, 13], // Merge to Joiner
  [13, 14], [14, 15], // Phase 5 vertical
];

export default function NodeChainVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeNode, setActiveNode] = useState(0);

  // Cycle active node
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % workflowNodes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animate particles along connections
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const cleanupFns: (() => void)[] = [];

    // Create traveling dots on each connection
    connections.forEach(([from, to], i) => {
      const fromPos = nodePositions[from];
      const toPos = nodePositions[to];

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '2');
      dot.setAttribute('fill', '#52796F');
      dot.setAttribute('opacity', '0.8');
      svg.appendChild(dot);

      const anim = gsap.to(dot, {
        attr: { cx: toPos.x, cy: toPos.y },
        duration: 1.5,
        delay: i * 0.15,
        repeat: -1,
        ease: 'none',
        onRepeat: () => {
          gsap.set(dot, { attr: { cx: fromPos.x, cy: fromPos.y } });
        },
      });

      gsap.set(dot, { attr: { cx: fromPos.x, cy: fromPos.y } });
      cleanupFns.push(() => { anim.kill(); dot.remove(); });
    });

    return () => { cleanupFns.forEach((fn) => fn()); };
  }, []);

  const getConnectionPath = (from: number, to: number) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    const midY = (fromPos.y + toPos.y) / 2;

    if (fromPos.x === toPos.x) {
      return `M ${fromPos.x} ${fromPos.y + 14} L ${toPos.x} ${toPos.y - 14}`;
    }
    // Horizontal + vertical curve for branching
    return `M ${fromPos.x} ${fromPos.y + 14} L ${fromPos.x} ${midY} L ${toPos.x} ${midY} L ${toPos.x} ${toPos.y - 14}`;
  };

  return (
    <svg
      ref={svgRef}
      width="280"
      height="600"
      viewBox="0 0 280 600"
      className="overflow-visible"
    >
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#84A98C" strokeWidth="0.5" strokeOpacity="0.15" />
        </pattern>
      </defs>
      <rect width="280" height="600" fill="url(#grid)" rx="12" />

      {/* Phase labels */}
      <text x="10" y="12" fontSize="9" fill="#52796F" fontFamily="Inter" fontWeight="600">Phase 1-2</text>
      <text x="10" y="295" fontSize="9" fill="#52796F" fontFamily="Inter" fontWeight="600">Split</text>
      <text x="10" y="470" fontSize="9" fill="#52796F" fontFamily="Inter" fontWeight="600">Phase 5</text>

      {/* Split indicator */}
      <g transform="translate(130, 290)">
        <circle r="8" fill="#52796F" opacity="0.2" />
        <path d="M -4 0 L 0 -4 L 4 0 M 0 -4 L 0 4" stroke="#52796F" strokeWidth="1.5" fill="none" transform="rotate(180)" />
      </g>

      {/* Connection lines */}
      {connections.map(([from, to], i) => (
        <path
          key={i}
          d={getConnectionPath(from, to)}
          stroke="#84A98C"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          fill="none"
        />
      ))}

      {/* Nodes */}
      {workflowNodes.map((node, i) => {
        const pos = nodePositions[i];
        const isActive = activeNode === i;

        return (
          <g key={node.id}>
            {/* Glow effect for active node */}
            {isActive && (
              <rect
                x={pos.x - 72}
                y={pos.y - 16}
                width="144"
                height="32"
                rx="6"
                fill="#52796F"
                opacity="0.08"
              >
                <animate attributeName="opacity" values="0.08;0.15;0.08" dur="2s" repeatCount="indefinite" />
              </rect>
            )}
            {/* Node rectangle */}
            <rect
              x={pos.x - 70}
              y={pos.y - 14}
              width="140"
              height="28"
              rx="6"
              fill="white"
              stroke={isActive ? '#52796F' : '#84A98C'}
              strokeWidth={isActive ? 2 : 1}
              strokeOpacity={isActive ? 1 : 0.5}
              style={{ transition: 'all 0.5s ease' }}
            />
            {/* Node text */}
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize="9"
              fontFamily="Inter"
              fontWeight="500"
              fill="#1B4332"
            >
              {node.name.length > 18 ? node.name.slice(0, 16) + '...' : node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
