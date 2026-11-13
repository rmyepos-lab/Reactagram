import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppText, IconButton, LedgeButton, Screen, TextField, ToggleRow } from '../components/ui';
import {
  ADMIN_MESSAGES,
  CONFIG_FIELDS,
  remoteConfig,
  useRemoteConfig,
  type ConfigKey,
  type RemoteConfig,
} from '../features/remoteConfig';
import type { RootScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const GROUPS = ['Ads', 'Pro', 'Support'] as const;

/**
 * Hidden admin screen. Signing in proves nothing to the app itself: the database decides
 * whether this account may save (supabase/setup.sql). The token lives in memory only, so
 * leaving the screen signs out.
 */
export function AdminScreen({ navigation }: RootScreenProps<'Admin'>) {
  const [token, setToken] = useState<string | null>(null);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" label="Close" onPress={navigation.goBack} />
        <AppText accessibilityRole="header" weight="black" size={20}>
          Admin
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {token ? <ConfigEditor token={token} /> : <SignIn onSignedIn={setToken} />}
      </ScrollView>
    </Screen>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await remoteConfig.signIn(email, password);
    setBusy(false);
    if (result.ok) {
      onSignedIn(result.data);
    } else {
      setError(ADMIN_MESSAGES[result.reason]);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.group}>
      <TextField
        label="Admin email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
      />
      <LedgeButton
        label={busy ? 'Signing in…' : 'Sign in'}
        tone="ink"
        disabled={busy || !email.trim() || !password}
        onPress={submit}
      />
    </Animated.View>
  );
}

function ConfigEditor({ token }: { token: string }) {
  const saved = useRemoteConfig();
  const [draft, setDraft] = useState<RemoteConfig>(saved);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = CONFIG_FIELDS.some(f => draft[f.key] !== saved[f.key]);
  const edit = (key: ConfigKey, value: boolean | string) => {
    setDraft(d => ({ ...d, [key]: value }));
    setNotice(null);
  };

  const save = async () => {
    setBusy(true);
    const result = await remoteConfig.save(token, draft);
    setBusy(false);
    setNotice(
      result.ok
        ? { ok: true, text: 'Saved. Users get it the next time they open the app.' }
        : { ok: false, text: ADMIN_MESSAGES[result.reason] },
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={styles.group}>
      {GROUPS.map(group => (
        <View key={group} style={styles.group}>
          <AppText accessibilityRole="header" weight="black" size={17}>
            {group}
          </AppText>
          {CONFIG_FIELDS.filter(f => f.group === group).map(field => {
            const value = draft[field.key];
            return typeof value === 'boolean' ? (
              <ToggleRow
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={value}
                onChange={v => edit(field.key, v)}
              />
            ) : (
              <TextField
                key={field.key}
                label={`${field.label} · ${field.hint}`}
                value={value}
                onChangeText={v => edit(field.key, v)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            );
          })}
        </View>
      ))}

      <LedgeButton label={busy ? 'Saving…' : 'Save for all users'} disabled={busy || !dirty} onPress={save} />

      {notice ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={[styles.notice, notice.ok ? styles.noticeOk : styles.noticeError]}
          accessibilityLiveRegion="polite"
        >
          <AppText
            weight="bold"
            size={14}
            leading={1.4}
            color={notice.ok ? colors.onCorrectContainer : colors.onWrongContainer}
          >
            {notice.text}
          </AppText>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  group: { gap: 12 },
  notice: { padding: 14, borderRadius: radii.md },
  noticeOk: { backgroundColor: colors.correctContainer },
  noticeError: { backgroundColor: colors.wrongContainer },
});
