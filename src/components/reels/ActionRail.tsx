import React from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { APP_NAME } from '../../config/app';
import { progress, useProgress } from '../../features/progress';
import { reel as palette } from '../../theme';
import { IconButton } from '../ui';
import { LikeButton } from './LikeButton';

type Props = { id: string; title: string; sourceUrl: string };

export function shareReel(title: string, sourceUrl: string) {
  Share.share({ message: `${title}\nLearned on ${APP_NAME}. Source: ${sourceUrl}` }).catch(
    () => undefined,
  );
}

/** The vertical like / save / share / docs buttons on the right side of a reel. */
export function ActionRail({ id, title, sourceUrl }: Props) {
  const liked = useProgress(p => p.liked.includes(id));
  const saved = useProgress(p => p.saved.includes(id));

  return (
    <View style={styles.rail}>
      <LikeButton
        liked={liked}
        onToggle={() => progress.toggleLike(id)}
        color={palette.text}
        likedColor={palette.liked}
        background={palette.chip}
        likedBackground={palette.likedContainer}
      />
      <IconButton
        icon="bookmark"
        label={saved ? 'Saved. Tap to remove' : 'Save'}
        selected={saved}
        filled={saved}
        color={palette.text}
        background={palette.chip}
        onPress={() => progress.toggleSave(id)}
      />
      <IconButton
        icon="share"
        label="Share"
        color={palette.text}
        background={palette.chip}
        onPress={() => shareReel(title, sourceUrl)}
      />
      <IconButton
        icon="docs"
        label="Read the source docs"
        color={palette.text}
        background={palette.chip}
        onPress={() => Linking.openURL(sourceUrl).catch(() => undefined)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', right: 10, bottom: 28, gap: 8, alignItems: 'center' },
});
