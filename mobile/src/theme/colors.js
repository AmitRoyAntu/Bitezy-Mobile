export { spacing } from './spacing';
export { fonts } from './fonts';
import { fonts } from './fonts';

export const colors = {
  primary: '#FF5A5F',
  primaryDark: '#E0484C',
  primaryLight: '#FFEAEB',
  secondary: '#2D3436',
  accent: '#FF9F43',
  success: '#2ECC71',
  successLight: '#E8F8F0',
  danger: '#FF7675',
  dangerLight: '#FFECEC',
  warning: '#F1C40F',
  warningLight: '#FEF9E7',
  info: '#0984E3',
  infoLight: '#EBF5FB',
  purple: '#6C5CE7',
  purpleLight: '#F0EEFD',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textDark: '#2D3436',
  textGray: '#6C757D',
  textLight: '#A0A0A0',
  border: '#EAEAEA',
  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0, 0, 0, 0.08)',
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
