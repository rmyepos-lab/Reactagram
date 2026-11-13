import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { parse, type ParsedToken } from 'sugar-high/core';
import { tokenize as tokenizeJs } from 'sugar-high/lang/javascript';
import { fonts, radii, reel } from '../../theme';
import { AppText } from '../ui';

type Props = {
  code: string;
  /** 1-based line numbers to highlight. Other lines are dimmed when this is set. */
  highlight?: readonly number[];
  fontSize?: number;
  background?: string;
  radius?: number;
};

// Use the JavaScript/JSX rules (the generic parser doesn't know keywords).
const tokenize = (code: string) => tokenizeJs(code, undefined);

function colorOf(token: ParsedToken, next?: ParsedToken): string | undefined {
  switch (token.type) {
    case 'keyword':
      return reel.syntax.keyword;
    case 'string':
      return reel.syntax.string;
    case 'comment':
      return reel.syntax.comment;
    case 'entity':
      return reel.syntax.function;
    case 'class':
      return /^\d/.test(token.value) ? reel.syntax.number : reel.syntax.function;
    case 'identifier':
      // An identifier right before "(" is a function call.
      return next?.type === 'sign' && next.value.startsWith('(')
        ? reel.syntax.function
        : undefined;
    default:
      return undefined;
  }
}

/** Syntax-colored code on a dark card. Colors come from the design tokens. */
export const CodeBlock = React.memo(function CodeBlockBase({
  code,
  highlight,
  fontSize = 14,
  background = reel.code,
  radius = radii.xl,
}: Props) {
  const lines = useMemo(() => parse(code, { tokenize }).lines, [code]);
  const marked = highlight && highlight.length > 0 ? new Set(highlight) : null;
  const lineHeight = Math.round(fontSize * 1.75);

  return (
    <View
      accessible
      accessibilityLabel={`Code: ${code}`}
      style={[styles.block, { backgroundColor: background, borderRadius: radius }]}
    >
      {lines.map((line, i) => {
        const isMarked = marked?.has(i + 1) ?? false;
        const base = marked && !isMarked ? reel.dim : reel.text;
        return (
          <View key={line.index} style={isMarked ? styles.marked : undefined}>
            <AppText
              style={{ fontFamily: fonts.mono, fontSize, lineHeight }}
              color={base}
            >
              {line.tokens.length === 0
                ? ' '
                : line.tokens.map((token, t) => {
                    const color = colorOf(token, line.tokens[t + 1]);
                    return color ? (
                      <AppText key={t} style={{ fontFamily: fonts.mono, fontSize }} color={color}>
                        {token.value}
                      </AppText>
                    ) : (
                      token.value
                    );
                  })}
            </AppText>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  block: { paddingVertical: 14, paddingHorizontal: 16 },
  marked: {
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: reel.codeHighlight,
  },
});
