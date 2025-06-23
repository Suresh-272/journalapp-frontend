/**
 * Journal app color theme
 * Warm, cozy colors with light and dark mode support
 */

const primaryBrown = '#4b3621';
const warmBeige = '#f5efe7';
const peachAccent = '#f7c5a8';
const pastelPink = '#ffe4e1';
const pastelBlue = '#cfe2f3';

export const Colors = {
  light: {
    text: primaryBrown,
    background: warmBeige,
    tint: peachAccent,
    icon: primaryBrown,
    tabIconDefault: '#8a7866',
    tabIconSelected: peachAccent,
    pastelPink: pastelPink,
    pastelBlue: pastelBlue,
    cardBackground: 'rgba(255, 255, 255, 0.7)',
  },
  dark: {
    text: '#f5efe7',
    background: '#2d2418',
    tint: peachAccent,
    icon: '#f5efe7',
    tabIconDefault: '#a99d8f',
    tabIconSelected: peachAccent,
    pastelPink: '#d4b5b0',
    pastelBlue: '#8ca7c4',
    cardBackground: 'rgba(40, 40, 40, 0.7)',
  },
};
