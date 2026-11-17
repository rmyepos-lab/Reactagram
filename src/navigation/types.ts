import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  /** `startId` opens the feed on that reel; `topic` filters the feed. */
  Learn: { startId?: string; topic?: string } | undefined;
  /**
   * `startId` plays that one question; `missed` plays the missed questions that are back today;
   * `resume` goes straight back into the unfinished quiz.
   */
  Quiz: { startId?: string; missed?: boolean; resume?: boolean } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Contact: undefined;
  /** Lessons and quizzes the learner saved. */
  Saved: undefined;
  /** Hidden: opened by tapping the version line in Profile seven times. */
  Admin: undefined;
};

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
