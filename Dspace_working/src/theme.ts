import { createTheme } from '@mui/material/styles';

// ChatGPT-inspired design tokens
const chatGPTTokens = {
  // Spacing (8px base unit)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  // Clean color palette inspired by ChatGPT
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // ChatGPT green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    gray: {
      50: '#ffffff',
      100: '#f9f9f9',
      200: '#f1f1f1',
      300: '#e6e6e6',
      400: '#d1d1d1',
      500: '#9e9e9e',
      600: '#757575',
      700: '#565656',
      800: '#2f2f2f',
      900: '#1a1a1a',
      950: '#0a0a0a',
    }
  },
  // Typography following ChatGPT's approach
  typography: {
    fontFamily: '"Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  }
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: chatGPTTokens.colors.primary[500],
      light: chatGPTTokens.colors.primary[400],
      dark: chatGPTTokens.colors.primary[600],
      contrastText: '#ffffff',
      ...chatGPTTokens.colors.primary,
    },
    secondary: {
      main: chatGPTTokens.colors.gray[600],
      light: chatGPTTokens.colors.gray[500],
      dark: chatGPTTokens.colors.gray[700],
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: chatGPTTokens.colors.gray[50], // Clean white background
      paper: chatGPTTokens.colors.gray[50], // Pure white for cards
    },
    text: {
      primary: chatGPTTokens.colors.gray[800], // Dark text on light background
      secondary: chatGPTTokens.colors.gray[600], // Muted text
    },
    divider: chatGPTTokens.colors.gray[200], // Subtle light borders
  },
  typography: {
    fontFamily: chatGPTTokens.typography.fontFamily,
    // Type scale inspired by ChatGPT's clean typography
    h1: {
      fontSize: '2rem', // 32px
      lineHeight: 1.25,
      fontWeight: chatGPTTokens.typography.weights.semibold,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontSize: '1.5rem', // 24px
      lineHeight: 1.33,
      fontWeight: chatGPTTokens.typography.weights.semibold,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.25rem', // 20px
      lineHeight: 1.4,
      fontWeight: chatGPTTokens.typography.weights.medium,
      letterSpacing: '-0.005em',
    },
    h4: {
      fontSize: '1.125rem', // 18px
      lineHeight: 1.44,
      fontWeight: chatGPTTokens.typography.weights.medium,
    },
    h5: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: chatGPTTokens.typography.weights.medium,
    },
    h6: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.57,
      fontWeight: chatGPTTokens.typography.weights.medium,
    },
    body1: {
      fontSize: '1rem', // 16px - ChatGPT uses larger base text
      lineHeight: 1.5,
      fontWeight: chatGPTTokens.typography.weights.normal,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.43,
      fontWeight: chatGPTTokens.typography.weights.normal,
    },
    caption: {
      fontSize: '0.75rem', // 12px
      lineHeight: 1.33,
      fontWeight: chatGPTTokens.typography.weights.normal,
      color: chatGPTTokens.colors.gray[600],
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8, // ChatGPT uses slightly larger border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: chatGPTTokens.typography.weights.medium,
          fontSize: '0.875rem',
          lineHeight: 1.43,
          padding: '10px 16px',
          minHeight: 40,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          backgroundColor: chatGPTTokens.colors.gray[800],
          color: chatGPTTokens.colors.gray[50],
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: chatGPTTokens.colors.gray[700],
            boxShadow: 'none',
          },
          '&:active': {
            backgroundColor: chatGPTTokens.colors.gray[900],
          },
        },
        outlined: {
          borderColor: chatGPTTokens.colors.gray[300],
          color: chatGPTTokens.colors.gray[700],
          '&:hover': {
            borderColor: chatGPTTokens.colors.gray[400],
            backgroundColor: chatGPTTokens.colors.gray[100],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: chatGPTTokens.colors.gray[50],
            borderRadius: 12,
            fontSize: '1rem',
            '& fieldset': {
              borderColor: chatGPTTokens.colors.gray[200],
              transition: 'border-color 0.2s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: chatGPTTokens.colors.gray[300],
            },
            '&.Mui-focused fieldset': {
              borderColor: chatGPTTokens.colors.gray[400],
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: chatGPTTokens.colors.gray[50],
          border: `1px solid ${chatGPTTokens.colors.gray[200]}`,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: chatGPTTokens.colors.gray[50],
          border: `1px solid ${chatGPTTokens.colors.gray[200]}`,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderColor: chatGPTTokens.colors.gray[300],
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: chatGPTTokens.colors.gray[100],
          },
        },
      },
    },
  },
});

export default theme; 