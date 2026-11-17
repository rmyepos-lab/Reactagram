import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminScreen } from '../screens/AdminScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { colors } from '../theme';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const renderTabBar = (props: React.ComponentProps<typeof TabBar>) => <TabBar {...props} />;

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: colors.surface } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}
    >
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
