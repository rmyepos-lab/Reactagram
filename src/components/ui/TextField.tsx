import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radii } from '../../theme';
import { AppText } from './AppText';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  /** Use the code font (license keys). */
  mono?: boolean;
  borderColor?: string;
  labelColor?: string;
};

/** Labelled text input with a focus ring and an error line. */
export function TextField({
  label,
  error,
  mono = false,
  borderColor = colors.border,
  labelColor = colors.textVariant,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const ring = error ? colors.wrong : focused ? colors.primary : borderColor;

  return (
    <View style={styles.field}>
      <AppText weight="extrabold" size={13} color={labelColor}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.outline}
        multiline={multiline}
        {...rest}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { borderColor: ring, fontFamily: mono ? fonts.mono : fonts.bold },
          multiline && styles.multiline,
          style,
        ]}
      />
      {error ? (
        <AppText weight="bold" size={12.5} color={colors.wrong} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 15,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top', borderRadius: radii.md },
});
