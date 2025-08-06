/**
 * Journal app color theme
 * Light, elegant colors inspired by the mood tracker design
 */

const primaryBrown = '#8B7355'; // Warm brown for text and accents
const warmBeige = '#F8F6F2'; // Very light cream background
const cardBeige = '#F5F0E8'; // Slightly darker cream for cards
const darkBrown = '#5D4E37'; // Dark brown for headings
const mediumBrown = '#8B7355'; // Medium brown for secondary text
const lightBrown = '#D4C4B0'; // Light brown for borders
const warmAccent = '#B8956A'; // Warm accent for buttons and highlights
const navBackground = '#5D4E37'; // Dark brown for navigation

export const Colors = {
  light: {
    text: darkBrown,
    background: warmBeige,
    tint: warmAccent,
    icon: darkBrown,
    tabIconDefault: mediumBrown,
    tabIconSelected: warmAccent,
    pastelPink: '#F5F0E8', // Light cream for subtle backgrounds
    pastelBlue: '#F0E6D2', // Very light warm tone
    cardBackground: cardBeige,
    inputBackground: '#FFFFFF',
    borderColor: lightBrown,
    buttonText: '#FFFFFF',
    placeholderText: '#A99D8F',
    navBackground: navBackground,
    navText: '#F5F0E8',
    navTextSelected: warmAccent,
  },
  dark: {
    text: '#F5F0E8',
    background: '#2D2418',
    tint: warmAccent,
    icon: '#F5F0E8',
    tabIconDefault: '#A99D8f',
    tabIconSelected: warmAccent,
    pastelPink: '#3D3D3D',
    pastelBlue: '#4A4A4A',
    cardBackground: '#3D3D3D',
    inputBackground: '#4A4A4A',
    borderColor: '#6B5B4F',
    buttonText: '#FFFFFF',
    placeholderText: '#A99D8f',
    navBackground: '#1A1A1A',
    navText: '#F5F0E8',
    navTextSelected: warmAccent,
  },
};
