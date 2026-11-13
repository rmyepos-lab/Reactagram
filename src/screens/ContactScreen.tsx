import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Chip, IconButton, LedgeButton, PressableScale, Screen, TextField } from '../components/ui';
import { APP_NAME, CONTACT_EMAIL, CONTACT_REPLY_TIME, CONTACT_WHATSAPP } from '../config/app';
import type { RootScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const TOPICS = ['Help', 'Feedback', 'Problem', 'Other'] as const;
type Topic = (typeof TOPICS)[number];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Neutral contact form. Play policy: nothing here may mention Pro, prices or buying.
 * Sending opens the phone's email app with the message filled in.
 */
export function ContactScreen({ navigation }: RootScreenProps<'Contact'>) {
  const [topic, setTopic] = useState<Topic>('Help');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);

  const send = async () => {
    const next = {
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Enter your email so we can reply.',
      message: message.trim().length >= 10 ? undefined : 'Write at least a short sentence.',
    };
    setErrors(next);
    if (next.email || next.message) {
      return;
    }
    if (!CONTACT_EMAIL) {
      setNotice("Contact isn't set up yet. Please try again later.");
      return;
    }
    const subject = encodeURIComponent(`[${APP_NAME}] ${topic}`);
    const body = encodeURIComponent(
      `${message.trim()}\n\nFrom: ${name.trim() || 'No name'}\nReply to: ${email.trim()}`,
    );
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
      setNotice('Your email app opened with the message. Press send there to finish.');
    } catch {
      setNotice(`No email app found. Write to ${CONTACT_EMAIL}.`);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={navigation.goBack} />
        <AppText accessibilityRole="header" weight="black" size={20}>
          Contact us
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <AppText weight="extrabold" size={13} color={colors.textVariant}>
            What is it about?
          </AppText>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {TOPICS.map(t => (
              <Chip key={t} label={t} size="md" selected={t === topic} onPress={() => setTopic(t)} />
            ))}
          </View>
        </View>

        <TextField label="Your name (optional)" value={name} onChangeText={setName} autoComplete="name" />
        <TextField
          label="Your email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />
        <TextField
          label="Message"
          value={message}
          onChangeText={setMessage}
          error={errors.message}
          placeholder="Tell us what's going on"
          multiline
        />

        <LedgeButton label="Send message" onPress={send} />

        {notice ? (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.notice} accessibilityLiveRegion="polite">
            <AppText weight="bold" size={14} leading={1.4} color={colors.onPrimaryContainer}>
              {notice}
            </AppText>
          </Animated.View>
        ) : null}

        {CONTACT_WHATSAPP ? (
          <PressableScale
            onPress={() => Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}`).catch(() => undefined)}
            accessibilityRole="link"
            accessibilityLabel="Message us on WhatsApp"
            style={styles.whatsapp}
          >
            <AppText weight="extrabold" size={14.5} color={colors.primary}>
              Or message us on WhatsApp
            </AppText>
          </PressableScale>
        ) : null}

        <AppText weight="bold" size={13} leading={1.4} color={colors.textMuted} style={styles.center}>
          We usually reply within {CONTACT_REPLY_TIME}.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },
  group: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notice: { padding: 14, borderRadius: radii.md, backgroundColor: colors.primaryTint },
  whatsapp: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
