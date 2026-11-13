import React, { useEffect } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AdsProvider } from './features/ads';
import { configureNarration } from './features/narration';
import { pro } from './features/pro';
import { remoteConfig } from './features/remoteConfig';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    configureNarration();
    pro.revalidateIfStale().catch(() => undefined);
    // Admin settings: read at launch and each time the app comes back to the front.
    remoteConfig.refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        remoteConfig.refresh();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AdsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AdsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
