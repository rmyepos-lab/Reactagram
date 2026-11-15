import type { Diagram, DiagramStep, LearnSlide } from './schema';

type TreeNode = Extract<Diagram, { kind: 'tree' }>['nodes'][number];

/** Most leaves a tree may have, so its boxes stay readable at phone width. */
export const MAX_TREE_LEAVES = 4;
/** Most rows a tree may have. */
export const MAX_TREE_DEPTH = 4;

const itemsOf = (d: Diagram): readonly { id: string }[] =>
  d.kind === 'tree' ? d.nodes : d.events;

/** Every narration line of a slide, in playing order. */
export const slideLines = (slide: Pick<LearnSlide, 'say' | 'steps'>): string[] => [
  slide.say,
  ...(slide.steps ?? []).map(s => s.say),
];

/**
 * What a visual slide shows while line `part` plays (0 is the slide's own `say`).
 * Items that no step names are there from the start; each step adds its `show` items.
 */
export function diagramState(
  diagram: Diagram,
  steps: readonly DiagramStep[] | undefined,
  part: number,
): { visible: Set<string>; focus?: string } {
  const later = new Set((steps ?? []).flatMap(s => s.show ?? []));
  const visible = new Set(itemsOf(diagram).map(i => i.id).filter(id => !later.has(id)));
  const played = (steps ?? []).slice(0, Math.max(0, part));
  played.forEach(s => s.show?.forEach(id => visible.add(id)));
  return { visible, focus: part > 0 ? played[played.length - 1]?.focus : undefined };
}

export type PlacedNode = TreeNode & {
  /** Center, as a fraction of the diagram width. */
  x: number;
  /** Row, 0 for the root. */
  depth: number;
};

/** Places a tree: leaves share the width evenly, each parent sits above the middle of its children. */
export function layoutTree(nodes: readonly TreeNode[]): { placed: PlacedNode[]; rows: number } {
  const children = new Map<string, TreeNode[]>();
  nodes.forEach(n => {
    if (n.parent) {
      children.set(n.parent, [...(children.get(n.parent) ?? []), n]);
    }
  });
  const leaves = nodes.filter(n => !children.has(n.id)).length;
  const placed: PlacedNode[] = [];
  let slot = 0;
  let rows = 0;
  const visit = (node: TreeNode, depth: number): number => {
    rows = Math.max(rows, depth + 1);
    const kids = children.get(node.id) ?? [];
    let x: number;
    if (kids.length === 0) {
      x = (slot + 0.5) / leaves;
      slot += 1;
    } else {
      const xs = kids.map(k => visit(k, depth + 1));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    placed.push({ ...node, x, depth });
    return x;
  };
  visit(nodes[0], 0);
  return { placed, rows };
}

/** Problems with a slide's diagram fields. Used by the content schema. */
export function diagramIssues(slide: Pick<LearnSlide, 'type' | 'visual' | 'steps'>): string[] {
  const issues: string[] = [];
  const { visual, steps } = slide;
  if (slide.type !== 'visual') {
    if (visual || steps) {
      issues.push('only visual slides can have visual or steps');
    }
    return issues;
  }
  if (!visual) {
    return ['a visual slide needs visual'];
  }
  const items = itemsOf(visual);
  const ids = new Set(items.map(i => i.id));
  if (ids.size !== items.length) {
    issues.push('diagram ids must be unique');
  }

  if (visual.kind === 'tree') {
    const seen = new Set<string>();
    visual.nodes.forEach((n, i) => {
      if (i === 0 && n.parent) {
        issues.push('the first node is the root and has no parent');
      }
      if (i > 0 && (!n.parent || !seen.has(n.parent))) {
        issues.push(`node ${n.id} needs a parent listed before it`);
      }
      seen.add(n.id);
    });
    if (issues.length === 0) {
      const { placed, rows } = layoutTree(visual.nodes);
      const parents = new Set(visual.nodes.map(n => n.parent));
      const leaves = placed.filter(n => !parents.has(n.id)).length;
      if (leaves > MAX_TREE_LEAVES) {
        issues.push(`a tree may have at most ${MAX_TREE_LEAVES} leaves`);
      }
      if (rows > MAX_TREE_DEPTH) {
        issues.push(`a tree may have at most ${MAX_TREE_DEPTH} rows`);
      }
    }
  }

  const shown = new Set<string>();
  steps?.forEach((step, i) => {
    step.show?.forEach(id => {
      if (!ids.has(id)) {
        issues.push(`step ${i} shows unknown id ${id}`);
      } else if (shown.has(id)) {
        issues.push(`step ${i} shows ${id} a second time`);
      }
      shown.add(id);
    });
    if (step.focus && !ids.has(step.focus)) {
      issues.push(`step ${i} focuses unknown id ${step.focus}`);
    }
  });
  if (steps && issues.length === 0) {
    // A focused item must be on screen, and a tree node can't appear before its parent.
    for (let part = 0; part <= steps.length; part++) {
      const { visible, focus } = diagramState(visual, steps, part);
      const when = part === 0 ? 'at the start' : `at step ${part - 1}`;
      if (focus && !visible.has(focus)) {
        issues.push(`${focus} is focused ${when} but not shown`);
      }
      if (visual.kind === 'tree') {
        visual.nodes.forEach(n => {
          if (n.parent && visible.has(n.id) && !visible.has(n.parent)) {
            issues.push(`${n.id} is shown ${when} before its parent ${n.parent}`);
          }
        });
      }
    }
  }
  return [...new Set(issues)];
}
