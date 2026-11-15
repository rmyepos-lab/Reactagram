import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { layoutTree, type Diagram as DiagramData } from '../../features/content';
import { durations, fonts, radii, reel as palette, springs } from '../../theme';
import { AppText } from '../ui';

type Props = {
  diagram: DiagramData;
  /** Ids of the nodes or events on screen now. */
  visible: ReadonlySet<string>;
  /** Id highlighted while the current line plays. */
  focus?: string;
};

/** A component tree or a timeline. Items fade in as the narration reveals them. */
export function Diagram({ diagram, visible, focus }: Props) {
  return diagram.kind === 'tree' ? (
    <Tree nodes={diagram.nodes} visible={visible} focus={focus} />
  ) : (
    <Timeline events={diagram.events} visible={visible} focus={focus} />
  );
}

const ROW = 76;
const NODE_H = 48;
const NODE_MAX_W = 128;
const GAP = 8;

type TreeProps = Omit<Props, 'diagram'> & { nodes: Extract<DiagramData, { kind: 'tree' }>['nodes'] };

function Tree({ nodes, visible, focus }: TreeProps) {
  const [width, setWidth] = useState(0);
  const { placed, rows } = useMemo(() => layoutTree(nodes), [nodes]);
  const byId = useMemo(() => new Map(placed.map(n => [n.id, n])), [placed]);
  const leaves = useMemo(
    () => placed.filter(n => !placed.some(c => c.parent === n.id)).length,
    [placed],
  );
  const height = (rows - 1) * ROW + NODE_H;
  const nodeW = Math.min(NODE_MAX_W, width / leaves - GAP);

  return (
    <View
      style={{ height }}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`Component tree: ${placed
        .filter(n => visible.has(n.id))
        .map(n => n.label)
        .join(', ')}`}
    >
      {width > 0
        ? placed.map(n => {
            const parent = n.parent ? byId.get(n.parent) : undefined;
            if (!parent || !visible.has(n.id)) {
              return null;
            }
            const px = parent.x * width;
            const cx = n.x * width;
            const top = parent.depth * ROW + NODE_H;
            const bottom = n.depth * ROW;
            const mid = (top + bottom) / 2;
            return (
              <Animated.View
                key={`edge-${n.id}`}
                entering={FadeIn.duration(durations.slow)}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              >
                <Svg width={width} height={height}>
                  <Path
                    d={`M${px} ${top} V${mid} H${cx} V${bottom}`}
                    stroke={n.id === focus ? palette.accent : palette.border}
                    strokeWidth={2}
                    fill="none"
                  />
                </Svg>
              </Animated.View>
            );
          })
        : null}
      {width > 0
        ? placed.map(n =>
            visible.has(n.id) ? (
              <Animated.View
                key={n.id}
                entering={FadeInDown.springify()
                  .damping(springs.gentle.damping)
                  .stiffness(springs.gentle.stiffness)}
                style={[
                  styles.node,
                  n.id === focus && styles.focused,
                  { left: n.x * width - nodeW / 2, top: n.depth * ROW, width: nodeW },
                ]}
              >
                <AppText
                  numberOfLines={1}
                  size={14}
                  color={palette.text}
                  style={styles.label}
                >
                  {n.label}
                </AppText>
                {n.note ? (
                  <AppText numberOfLines={1} weight="bold" size={11} color={palette.muted}>
                    {n.note}
                  </AppText>
                ) : null}
              </Animated.View>
            ) : null,
          )
        : null}
    </View>
  );
}

type TimelineProps = Omit<Props, 'diagram'> & {
  events: Extract<DiagramData, { kind: 'timeline' }>['events'];
};

function Timeline({ events, visible, focus }: TimelineProps) {
  const shown = events.filter(e => visible.has(e.id));
  return (
    <View
      style={styles.timeline}
      accessible
      accessibilityLabel={`Timeline: ${shown.map(e => e.label).join(', then ')}`}
    >
      {shown.map((e, i) => {
        const on = e.id === focus;
        return (
          <Animated.View
            key={e.id}
            entering={FadeInDown.springify()
              .damping(springs.gentle.damping)
              .stiffness(springs.gentle.stiffness)}
            style={styles.event}
          >
            <View style={styles.rail}>
              <View style={[styles.dot, on && styles.dotOn]} />
              {i < shown.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={[styles.eventBody, on && styles.focused]}>
              <AppText weight="extrabold" size={15} color={palette.text}>
                {e.label}
              </AppText>
              {e.note ? (
                <AppText weight="semibold" size={13} leading={1.35} color={palette.muted}>
                  {e.note}
                </AppText>
              ) : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    height: NODE_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.chip,
  },
  focused: { borderColor: palette.accent, backgroundColor: palette.topicChip },
  label: { fontFamily: fonts.monoBold },
  timeline: { gap: 0 },
  event: { flexDirection: 'row', gap: 12 },
  rail: { width: 14, alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    marginTop: 14,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: palette.accent,
    backgroundColor: palette.background,
  },
  dotOn: { backgroundColor: palette.accent },
  line: { flex: 1, width: 2, marginTop: 4, backgroundColor: palette.border },
  eventBody: {
    flex: 1,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
