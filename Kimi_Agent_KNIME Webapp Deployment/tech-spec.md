# Replenishment Automation — Technical Specification

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | React DOM renderer |
| react-router | ^7.0.0 | Client-side routing (3 pages) |
| gsap | ^3.12.0 | Core animation engine, scroll-triggered reveals, timeline sequencing |
| lenis | ^1.1.0 | Smooth scroll with inertia |
| react-countup | ^6.5.0 | Metric number count-up animation on scroll |
| recharts | ^2.13.0 | Dashboard bar chart (Sell-Through Performance Distribution) |
| lucide-react | ^0.460.0 | Icon library (16 node icons, UI icons) |
| @fontsource/playfair-display | ^5.0.0 | Display/heading font |
| @fontsource/inter | ^5.0.0 | Body/UI font |
| tailwindcss | ^3.4.0 | Utility-first CSS |
| @tailwindcss/typography | ^0.5.0 | Prose typography plugin |

**Dev Dependencies**: Vite, TypeScript, PostCSS, Autoprefixer (bundled with webapp-building init).

---

## Component Inventory

### Layout (shared across all pages)

| Component | Source | Notes |
|-----------|--------|-------|
| NavigationBar | Custom | Fixed 64px bar, backdrop-blur, scroll-aware border, mobile hamburger overlay |
| Footer | Custom | 4-column Deep Forest footer |
| CustomCursor | Custom | 12px circle, GSAP-driven position with lag, hover state scaling |
| ScrollReveal | Custom | Reusable wrapper: GSAP ScrollTrigger fade-up entrance, configurable stagger/delay |

### Home Page Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | 60/40 split, left text + right NodeChainVisualization |
| HowItWorksSection | Custom | 3-step card flow with connecting arrows |
| NodeExplorerSection | Custom | Sticky left text + scrollable right node list (16 items), active state tracking |
| LogicVisualizationSection | Custom | 3 rule engine cards on Deep Forest bg with monospace logic blocks |
| ImpactMetricsSection | Custom | 2x2 metric grid with react-countup integration |
| WorkflowDiagramSection | Custom | Vertical 5-phase SVG flowchart with path-draw animation |
| CTASection | Custom | Centered CTA on Deep Forest background |

### Dashboard Page

| Component | Source | Notes |
|-----------|--------|-------|
| DashboardLayout | Custom | Header + Stats Row + two-panel main content |
| DashboardHeader | Custom | Title, live timestamp, search, refresh/settings buttons |
| StatsRow | Custom | 4 stat cards (reused pattern) |
| NodeStatusPanel | Custom | Fixed 320px left panel: progress bar + scrollable node list with filtering |
| NodeDetailPanel | Custom | Dynamic right panel: header, logic block, data flow I/O columns |
| PerformanceChart | Recharts | Bar chart with animated bar heights |

### Admin Page

| Component | Source | Notes |
|-----------|--------|-------|
| AdminLayout | Custom | Fixed 240px sidebar + main content area |
| AdminSidebar | Custom | Nav items with active state, logout button |
| UsersPage | Custom | Stats + data table with role/status badges |
| WorkflowLogsPage | Custom | Paginated log table with status badges |
| SystemSettingsPage | Custom | Toggle switches + input fields grouped by category |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| PillButton | Custom | Nav, Hero, CTA, Admin — two variants (filled/outline) |
| MetricCard | Custom | ImpactMetrics, Dashboard stats, Admin stats |
| NodeCard | Custom | NodeExplorer list items, WorkflowDiagram nodes |
| LogicBlock | Custom | LogicVisualization, NodeDetailPanel — monospace code display |
| StatusBadge | Custom | Admin tables — role/status indicators |
| DataTable | Custom | UsersPage, WorkflowLogsPage — sortable with actions |

---

## Animation Implementation

| Animation | Library | Approach | Complexity |
|-----------|---------|----------|------------|
| Custom cursor (follow + hover scale) | GSAP | `gsap.quickTo` for x/y with 0.15s ease-out lag; scale toggle on interactive element hover | Medium |
| Page load sequence | GSAP | Single `gsap.timeline()` with labeled child tweens, staggered delays, power3.out easing | Medium |
| Scroll-triggered reveals | GSAP + ScrollTrigger | Reusable `ScrollReveal` component: ScrollTrigger batch with opacity/y tween, configurable stagger | Low |
| Hero node chain visualization | GSAP + SVG | SVG-based: 16 rect nodes + path connections; GSAP timeline cycles active node every 2s (stroke/glow transition); `gsap.to` tweens move circle particles along path coordinates | High |
| Workflow diagram draw | GSAP + ScrollTrigger | SVG paths: calculate path length, animate `stroke-dashoffset` on scroll trigger; node rects fade simultaneously; phase labels slide from left | Medium |
| Metric count-up | react-countup + Intersection Observer | CountUp component triggered by custom hook (`useInView`); 1.5s duration; pulse scale on complete via GSAP | Low |
| Connecting arrows (How It Works) | CSS | Static horizontal lines with centered arrow icon; no animation needed | Low |
| Node explorer active state | GSAP + ScrollTrigger | ScrollTrigger on each node card: onEnterCenter toggles border/number color via GSAP class toggle | Medium |
| Logic card entrance | GSAP + ScrollTrigger | Scale 0.95→1 + opacity, stagger 0.15s | Low |
| Dashboard card hover | CSS | `translateY(-2px)` + box-shadow transition, 0.3s | Low |
| Bar chart animation | Recharts | `animationDuration={800}` on Bar component | Low |
| Loading overlay | GSAP | 16-segment progress bar fills sequentially, then overlay fades out | Medium |
| Nav border on scroll | GSAP + ScrollTrigger | ScrollTrigger at 100px toggles class for border-bottom visibility | Low |
| Mobile menu overlay | GSAP | Slide-in from right, 0.3s power3.out | Low |

---

## State & Logic

### Node Data Architecture

The 16-node workflow data is the core content model. Store as a static array of typed objects:

```typescript
interface WorkflowNode {
  id: number;
  name: string;
  type: string;
  phase: number;        // 1-5
  phaseName: string;
  description: string;
  logic?: string;       // For rule engines / math formula
  input?: string[];     // Input column names
  output?: string[];    // Output column names
  icon: string;         // Lucide icon name
  string?: 1 | 2;       // For split-phase nodes (8-9 = string1, 10-13 = string2)
}
```

This single data array drives: NodeExplorer list, WorkflowDiagram, Dashboard node status list, and NodeDetailPanel. No duplication.

### Dashboard Selection State

```typescript
interface DashboardState {
  selectedNodeId: number | null;
  searchQuery: string;       // Node list filter
  nodeFilter: string;        // Status filter (all/active)
}
```

`selectedNodeId` drives the right panel content. When null, show a placeholder prompt. Managed with `useState` at DashboardLayout level, passed down via props.

### Admin Route Guard

The Admin page requires authentication + admin role. Use a route guard component that:
1. Checks auth state (from tRPC `auth.me` query)
2. Redirects to `/` if not authenticated
3. Redirects to `/dashboard` if authenticated but not admin
4. Renders `AdminLayout` if admin

### Auth State (useAuth hook)

- Exposes: `user`, `isLoading`, `isAdmin`, `login()`, `logout()`
- `isAdmin` derived from `user.role === "admin"`
- Logout: clears session cookie + `window.location.reload()`
- Used by: NavigationBar (conditional admin link), Admin route guard, user profile display

### Performance Chart Data

Static mock data representing the classification output:
```typescript
const performanceData = [
  { category: "Good Performer", count: 12 },
  { category: "Poor Performer", count: 8 },
  { category: "Receiver", count: 10 },
  { category: "Doner", count: 6 },
  { category: "Neutral", count: 4 },
];
```

---

## Other Key Decisions

### Routing Structure

```
/           → Home (all 7 sections)
/dashboard  → Dashboard (protected: requires auth)
/admin      → Admin (protected: requires auth + admin role)
/login      → Login (auto-wired by backend-building)
```

### SVG Strategy

Two distinct SVG implementations:
1. **Hero Node Chain** (~400x500px): Inline React SVG with GSAP-controlled attributes. Nodes positioned via computed coordinates (not CSS). Particles use GSAP `motionPath` or manual coordinate interpolation.
2. **Workflow Diagram** (~900px wide): Inline React SVG with ScrollTrigger-controlled `stroke-dashoffset` animations. Simpler — no particle system, just draw-on-reveal.

### Custom Cursor Implementation

The cursor is a portal-rendered `div` (to escape `overflow:hidden` containers). Position updated via `gsap.quickTo` for x and y (creates the 0.15s lag). A `useEffect` attaches mousemove listeners to `document`. Interactive element detection via `mouseenter`/`mouseleave` delegation on `[data-cursor-hover]` elements. Hidden on touch devices via `@media (hover: none)`.

### Mobile Simplifications

- Hero Node Chain: replaced with 3 connected circle icons (no animation)
- Workflow Diagram: collapses to a vertical list of phase labels + node counts
- Dashboard: left panel becomes a toggleable drawer overlay
- Admin sidebar: collapses to hamburger-triggered drawer
- Custom cursor: disabled entirely on touch devices

### Count-up Integration Pattern

Wrap `react-countup` in a custom `AnimatedNumber` component that:
1. Accepts `target` and `duration` props
2. Uses `useInView` hook (Intersection Observer) to trigger start
3. Renders number in Playfair Display via a `span`
4. On complete, fires a GSAP pulse tween on the span element

This isolates the countup + Intersection Observer + GSAP pulse logic into one reusable component used in ImpactMetrics and potentially Dashboard stats.
