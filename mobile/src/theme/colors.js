export { spacing } from './spacing.js';
export { fonts } from './fonts.js';
import { fonts } from './fonts.js';


export const colors = {
  // Brand / Gourmet Flame
  primary: '#FF4B26',
  primaryDark: '#E03714',
  primaryLight: '#FFF0ED',
  primaryGlow: 'rgba(255, 75, 38, 0.15)',
  
  // Base & Dark Accents
  secondary: '#181A20',
  secondaryLight: '#35383F',
  accent: '#FF9800',
  accentLight: '#FFF8E1',

  // Status & Feedback
  success: '#00B761',
  successLight: '#E6F9F0',
  successBorder: '#A7F3D0',
  danger: '#FA3E3E',
  dangerDark: '#D92525',
  dangerLight: '#FEECEC',
  dangerBorder: '#FECACA',
  warning: '#FFAB00',
  warningLight: '#FFF9E6',
  warningBorder: '#FEF08A',
  info: '#246BFD',
  infoLight: '#EEF4FF',
  infoBorder: '#BFDBFE',
  purple: '#7952FC',
  purpleLight: '#F3EFFF',
  purpleBorder: '#DDD6FE',

  // Ratings & Social
  rating: '#F59E0B',
  ratingBg: '#FFF8E6',
  ratingBorder: '#FEF08A',
  ratingText: '#B45309',
  whatsApp: '#25D366',

  // Surfaces & Backgrounds
  background: '#F8F9FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  surfaceSubtle: '#F1F3F7',
  inputBg: '#FAFAFC',

  // Typography Colors
  textDark: '#121217',
  textGray: '#64748B',
  textLight: '#94A3B8',

  // Borders & Dividers
  border: '#F0F1F5',
  borderDark: '#E2E8F0',

  // Neutrals & Glass
  white: '#FFFFFF',
  black: '#000000',
  glassDark: 'rgba(18, 18, 23, 0.72)',
  overlay: 'rgba(18, 18, 23, 0.45)',
  shadow: 'rgba(18, 18, 23, 0.07)',
  shadowStrong: 'rgba(18, 18, 23, 0.14)',
};


export const typography = {
  header: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    color: colors.textDark,
  },
  subHeader: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 18,
    color: colors.textDark,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.textDark,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
  },
};

