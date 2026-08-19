// Theme constants — exact match of Bitezy web CSS variables

export const COLORS = {
  // Branding
  primary: '#FF6B6B',
  primaryHover: '#EE5253',
  primaryLight: '#FFF0F0',
  secondary: '#48DBFB',

  // Neutrals
  dark: '#2D3436',
  gray: '#636E72',
  light: '#F7F9FC',
  white: '#FFFFFF',
  border: '#F1F2F6',
  bg: '#F7F9FC',

  // Status
  success: '#00B894',
  danger: '#D63031',
  warning: '#FDCB6E',
  info: '#74B9FF',
  purple: '#A29BFE',
};

export const STATUS_COLORS = {
  PENDING:    { bg: '#FFF4E5', text: '#FF9F43' },
  PREPARING:  { bg: '#F3F3F3', text: '#576574' },
  ON_THE_WAY: { bg: '#E3F2FD', text: '#2E86DE' },
  READY:      { bg: '#E3F2FD', text: '#2E86DE' },
  DELIVERED:  { bg: '#E8F5E9', text: '#27AE60' },
  PICKED_UP:  { bg: '#E8F5E9', text: '#27AE60' },
  CANCELLED:  { bg: '#FFEBEE', text: '#D63031' },
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemiBold: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
};

export const SIZES = {
  radius: 16,
  radiusSm: 12,
  radiusXs: 8,
  paddingScreen: 20,
  headerHeight: 60,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};
