import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'journalTitle' | 'journalBody';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'DancingScript-Bold', // Beautiful cursive for main app title only
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter-Bold', // Clean, professional for subtitles
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#f7c5a8',
    fontFamily: 'Inter-Medium', // Keep clean for links
  },
  journalTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Caveat-Bold', // Handwriting only for journal entry titles
  },
  journalBody: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'Caveat-Regular', // Handwriting only for journal content
  },
});
