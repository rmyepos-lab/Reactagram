import { diagramIssues, diagramState, layoutTree, slideLines } from '../src/features/content/diagram';
import { learnSlideSchema } from '../src/features/content/schema';
import type { Diagram, LearnSlide } from '../src/features/content/schema';

const tree: Diagram = {
  kind: 'tree',
  nodes: [
    { id: 'app', label: 'App' },
    { id: 'list', label: 'List', parent: 'app' },
    { id: 'item', label: 'Item', parent: 'list' },
    { id: 'form', label: 'Form', parent: 'app' },
  ],
};

const slide = (extra: Partial<LearnSlide>): LearnSlide => ({
  type: 'visual',
  visual: tree,
  say: 'App renders a list and a form.',
  ...extra,
});

describe('layoutTree', () => {
  it('spreads leaves evenly and centers parents over their children', () => {
    const { placed, rows } = layoutTree(tree.nodes);
    const x = Object.fromEntries(placed.map(n => [n.id, n.x]));
    expect(rows).toBe(3);
    expect(x.item).toBeCloseTo(0.25);
    expect(x.form).toBeCloseTo(0.75);
    expect(x.list).toBeCloseTo(0.25);
    expect(x.app).toBeCloseTo(0.5);
  });
});

describe('diagramState', () => {
  const steps = [
    { say: 'List renders each item.', show: ['item'], focus: 'item' },
    { say: 'The form sits beside it.', focus: 'form' },
  ];

  it('shows unnamed items first, then adds each step', () => {
    expect([...diagramState(tree, steps, 0).visible].sort()).toEqual(['app', 'form', 'list']);
    expect(diagramState(tree, steps, 0).focus).toBeUndefined();
    expect(diagramState(tree, steps, 1)).toEqual({
      visible: new Set(['app', 'list', 'form', 'item']),
      focus: 'item',
    });
    expect(diagramState(tree, steps, 2).focus).toBe('form');
  });

  it('lists the slide line, then each step line', () => {
    expect(slideLines(slide({ steps }))).toEqual([
      'App renders a list and a form.',
      'List renders each item.',
      'The form sits beside it.',
    ]);
  });
});

describe('diagramIssues', () => {
  it('accepts a valid visual slide', () => {
    expect(diagramIssues(slide({ steps: [{ say: 'Here is the item.', show: ['item'] }] }))).toEqual([]);
    expect(learnSlideSchema.safeParse(slide({})).success).toBe(true);
  });

  it('rejects diagrams on other slide types and visual slides without one', () => {
    expect(diagramIssues({ type: 'text', visual: tree })).toHaveLength(1);
    expect(diagramIssues({ type: 'visual' })).toEqual(['a visual slide needs visual']);
  });

  it('rejects broken trees', () => {
    const orphan: Diagram = {
      kind: 'tree',
      nodes: [
        { id: 'app', label: 'App' },
        { id: 'item', label: 'Item', parent: 'list' },
      ],
    };
    expect(diagramIssues(slide({ visual: orphan }))).toEqual([
      'node item needs a parent listed before it',
    ]);
    const wide: Diagram = {
      kind: 'tree',
      nodes: [{ id: 'r', label: 'R' }, ...['a', 'b', 'c', 'd', 'e'].map(id => ({ id, label: id, parent: 'r' }))],
    };
    expect(diagramIssues(slide({ visual: wide }))).toEqual(['a tree may have at most 4 leaves']);
  });

  it('rejects steps that point at missing or hidden items', () => {
    expect(diagramIssues(slide({ steps: [{ say: 'Look here.', show: ['nope'] }] }))).toEqual([
      'step 0 shows unknown id nope',
    ]);
    expect(diagramIssues(slide({ steps: [{ say: 'The item appears.', show: ['list'] }] }))).toEqual([
      'item is shown at the start before its parent list',
    ]);
    expect(
      diagramIssues(
        slide({
          steps: [
            { say: 'Look at the item.', focus: 'item' },
            { say: 'Now it appears.', show: ['item'] },
          ],
        }),
      ),
    ).toEqual(['item is focused at step 0 but not shown']);
  });
});
