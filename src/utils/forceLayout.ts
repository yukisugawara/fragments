/**
 * Small, dependency-free Fruchterman-Reingold style force-directed layout.
 * Good enough for knowledge graphs up to a few hundred nodes.
 */

export interface LayoutNode {
  id: string;
  weight?: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ForceLayoutOptions {
  iterations?: number;
  repulsion?: number;
  springLength?: number;
  springStrength?: number;
  gravity?: number;
  damping?: number;
  /** Minimum center-to-center distance between any two nodes (collision radius * 2) */
  minDistance?: number;
  /** How many collision-resolution passes per iteration (higher = stricter separation) */
  collisionPasses?: number;
  /** Initial seed positions (e.g., preserved drag positions) */
  seed?: Map<string, Position>;
  /** Whether to lock seeded nodes (they won't move) */
  lockSeeded?: boolean;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  locked: boolean;
}

export function forceLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts: ForceLayoutOptions = {}
): Map<string, Position> {
  const {
    iterations = 320,
    repulsion = 12000,
    springLength = 170,
    springStrength = 0.045,
    gravity = 0.016,
    damping = 0.82,
    minDistance = 135,
    collisionPasses = 2,
    seed,
    lockSeeded = false,
  } = opts;

  if (nodes.length === 0) return new Map();

  // Seed positions in a coarse hex-ish pattern (better than pure random for early convergence)
  const sim: SimNode[] = nodes.map((n, i) => {
    const seedPos = seed?.get(n.id);
    if (seedPos) {
      return {
        id: n.id,
        x: seedPos.x,
        y: seedPos.y,
        vx: 0,
        vy: 0,
        locked: lockSeeded,
      };
    }
    // Spiral layout seed for fresh nodes
    const radius = 40 + Math.sqrt(i + 1) * 55;
    const angle = i * 2.399; // golden-angle spiral
    return {
      id: n.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      locked: false,
    };
  });

  const byId = new Map(sim.map((n) => [n.id, n]));
  const filteredEdges = edges.filter((e) => byId.has(e.source) && byId.has(e.target));

  // Pre-compute degree for variable spring length (higher-degree nodes get slightly pulled closer)
  const degree = new Map<string, number>();
  for (const e of filteredEdges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const temperature = Math.max(0.15, 1 - iter / iterations);

    // Pairwise repulsion (O(n²) but fine for the expected sizes)
    for (let i = 0; i < sim.length; i++) {
      const a = sim[i];
      for (let j = i + 1; j < sim.length; j++) {
        const b = sim[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1) {
          // Avoid infinities by jittering
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          dist2 = 1;
        }
        const dist = Math.sqrt(dist2);
        const force = repulsion / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.locked) {
          a.vx -= fx;
          a.vy -= fy;
        }
        if (!b.locked) {
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // Spring attraction along edges
    for (const edge of filteredEdges) {
      const a = byId.get(edge.source)!;
      const b = byId.get(edge.target)!;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - springLength;
      const force = displacement * springStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!a.locked) {
        a.vx += fx;
        a.vy += fy;
      }
      if (!b.locked) {
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Gravity toward origin to keep the graph compact
    for (const n of sim) {
      if (n.locked) continue;
      n.vx -= n.x * gravity;
      n.vy -= n.y * gravity;
    }

    // Integrate with damping and temperature-scaled motion cap
    const maxStep = 40 * temperature;
    for (const n of sim) {
      if (n.locked) continue;
      n.vx *= damping;
      n.vy *= damping;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > maxStep) {
        n.vx = (n.vx / speed) * maxStep;
        n.vy = (n.vy / speed) * maxStep;
      }
      n.x += n.vx;
      n.y += n.vy;
    }

    // Collision resolution — separate any pair closer than minDistance.
    // Runs multiple passes per iteration for stricter non-overlap.
    for (let pass = 0; pass < collisionPasses; pass++) {
      for (let i = 0; i < sim.length; i++) {
        const a = sim[i];
        for (let j = i + 1; j < sim.length; j++) {
          const b = sim[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) {
            dx = (Math.random() - 0.5) * 0.5;
            dy = (Math.random() - 0.5) * 0.5;
            dist2 = dx * dx + dy * dy + 0.01;
          }
          const dist = Math.sqrt(dist2);
          if (dist >= minDistance) continue;
          const overlap = (minDistance - dist) / 2;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;
          if (a.locked && b.locked) continue;
          if (a.locked) {
            b.x += ox * 2;
            b.y += oy * 2;
          } else if (b.locked) {
            a.x -= ox * 2;
            a.y -= oy * 2;
          } else {
            a.x -= ox;
            a.y -= oy;
            b.x += ox;
            b.y += oy;
          }
        }
      }
    }
  }

  const out = new Map<string, Position>();
  for (const n of sim) out.set(n.id, { x: n.x, y: n.y });
  return out;
}
