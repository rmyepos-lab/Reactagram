import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

export type ReelPagerHandle = { next: () => void };

type Props<T> = {
  data: readonly T[];
  keyOf: (item: T) => string;
  renderReel: (item: T, state: { active: boolean; height: number; index: number }) => React.ReactElement;
  onActiveChange?: (item: T, index: number) => void;
  /** Called near the end so the caller can add more reels (endless feed). */
  onNeedMore?: () => void;
  footer?: React.ReactElement;
  background: string;
};

type Viewable<T> = { viewableItems: { index?: number | null; item: T }[] };

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

/**
 * Full-screen vertical pager, one reel per page, like Instagram reels.
 * Only the visible reel is "active"; neighbours stay mounted so swipes are instant.
 */
function ReelPagerInner<T>(
  { data, keyOf, renderReel, onActiveChange, onNeedMore, footer, background }: Props<T>,
  ref: React.Ref<ReelPagerHandle>,
) {
  const list = useRef<FlatList<T>>(null);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const latest = useRef({ data, onActiveChange, activeIndex });
  latest.current = { data, onActiveChange, activeIndex };

  useImperativeHandle(ref, () => ({
    next() {
      const { data: items, activeIndex: current } = latest.current;
      if (current < items.length - 1) {
        list.current?.scrollToIndex({ index: current + 1, animated: true });
      }
    },
  }));

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(Math.round(e.nativeEvent.layout.height));
  }, []);

  // FlatList needs a stable callback here, so it reads the latest props from a ref.
  const onViewable = useRef(({ viewableItems }: Viewable<T>) => {
    const first = viewableItems[0];
    if (first?.index != null && first.index !== latest.current.activeIndex) {
      setActiveIndex(first.index);
      latest.current.onActiveChange?.(first.item, first.index);
    }
  }).current;

  return (
    <View style={[styles.fill, { backgroundColor: background }]} onLayout={onLayout}>
      {height > 0 && (
        <FlatList
          ref={list}
          data={data}
          keyExtractor={keyOf}
          renderItem={({ item, index }) => (
            <View style={{ height }}>
              {renderReel(item, { active: index === activeIndex, height, index })}
            </View>
          )}
          extraData={activeIndex}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          onEndReached={onNeedMore}
          onEndReachedThreshold={2}
          ListFooterComponent={footer ? <View style={{ height }}>{footer}</View> : undefined}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

export const ReelPager = forwardRef(ReelPagerInner) as <T>(
  props: Props<T> & { ref?: React.Ref<ReelPagerHandle> },
) => React.ReactElement;

const styles = StyleSheet.create({ fill: { flex: 1 } });
