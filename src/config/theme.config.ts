/**
 * =====================================================
 * RETROUVONSLES - Theme Configuration
 * =====================================================
 * Design tokens, colors, typography, spacing, and theming
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary Brand Colors
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#a855f7', // Main secondary
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3f0f5c',
  },

  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
    950: '#052e16',
  },

  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error/Danger
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Info
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main info
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#051e3e',
  },

  // Neutral/Grayscale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#0a0a0a',
  },

  // Text Colors
  text: {
    primary: '#212121', // neutral-900
    secondary: '#616161', // neutral-700
    tertiary: '#9e9e9e', // neutral-500
    inverse: '#fafafa', // neutral-50
    disabled: '#bdbdbd', // neutral-400
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5', // neutral-100
    tertiary: '#eeeeee', // neutral-200
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Border Colors
  border: {
    light: '#eeeeee', // neutral-200
    default: '#bdbdbd', // neutral-400
    dark: '#757575', // neutral-600
  },

  // Semantic Colors
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',
  },

  // Status Colors
  status: {
    active: '#22c55e',
    inactive: '#bdbdbd',
    pending: '#f59e0b',
    error: '#ef4444',
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    mono: '"Courier New", "Courier", monospace',
    serif: '"Georgia", "Garamond", serif',
  },

  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
    '6xl': '36px',
    '7xl': '42px',
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================
// HEADING STYLES
// ============================================

export const headings = {
  h1: {
    fontSize: '42px',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    marginBottom: '24px',
  },
  h2: {
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
    marginBottom: '20px',
  },
  h3: {
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    marginBottom: '16px',
  },
  h4: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '12px',
  },
  h5: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '12px',
  },
  h6: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '8px',
  },
};

// ============================================
// SPACING SCALE
// ============================================

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// ============================================
// TRANSITIONS & ANIMATIONS
// ============================================

export const transitions = {
  durations: {
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '800ms',
  },

  timingFunctions: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
    cubic: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInCubic: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOutCubic: 'cubic-bezier(0, 0, 0.2, 1)',
  },

  default: 'all 200ms ease',
};

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 9999,
};

// ============================================
// THEME VARIANTS
// ============================================

export const themeConfig = {
  defaultTheme: 'light',
  availableThemes: ['light', 'dark'],

  light: {
    colors,
    typography,
    headings,
    spacing,
    borderRadius,
    shadows,
    transitions,
    breakpoints,
    zIndex,
  },

  dark: {
    // Dark theme colors would be implemented here
    colors: {
      ...colors,
      text: {
        ...colors.text,
        primary: '#fafafa',
        secondary: '#bdbdbd',
      },
      background: {
        ...colors.background,
        primary: '#212121',
        secondary: '#424242',
      },
    },
    typography,
    headings,
    spacing,
    borderRadius,
    shadows,
    transitions,
    breakpoints,
    zIndex,
  },
};

// ============================================
// RESPONSIVE UTILITIES
// ============================================

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,

  mobile: `(max-width: ${breakpoints.sm})`,
  tablet: `(max-width: ${breakpoints.md})`,
  desktop: `(min-width: ${breakpoints.lg})`,
};
