import { alpha } from '@mui/material';

export function getStudioSurfaceSx(theme, accent, options = {}) {
  const {
    borderAlpha = 0.08,
    darkTint = 0.08,
    lightTint = 0.05,
    darkBackground = 'rgba(17,24,37,0.96)',
    darkBackgroundEnd = 'rgba(11,17,28,0.99)',
    lightBackground = 'rgba(255,255,255,0.98)',
    lightBackgroundEnd = 'rgba(247,249,255,0.96)',
    shadowAlpha = 0.05,
  } = options;

  return {
    borderRadius: 6,
    border: `1px solid ${
      theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(accent, borderAlpha)
    }`,
    background:
      theme.palette.mode === 'dark'
        ? `linear-gradient(155deg, ${alpha(accent, darkTint)} 0%, ${darkBackground} 56%, ${darkBackgroundEnd} 100%)`
        : `linear-gradient(155deg, ${alpha(accent, lightTint)} 0%, ${lightBackground} 58%, ${lightBackgroundEnd} 100%)`,
    backdropFilter: 'blur(20px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 24px 54px ${alpha('#000000', 0.2)}`
        : `0 24px 54px ${alpha(accent, shadowAlpha)}`,
  };
}

export function getStudioFieldSx(theme, accent, options = {}) {
  const {
    radius = 3.5,
    alignTop = false,
    lightBackgroundAlpha = 0.8,
    darkBackgroundAlpha = 0.02,
  } = options;

  return {
    '& .MuiInputLabel-root': {
      color: theme.palette.mode === 'dark' ? '#92a2bb' : '#6a7690',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: alpha(accent, 0.9),
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: radius,
      ...(alignTop ? { alignItems: 'flex-start' } : {}),
      backgroundColor:
        theme.palette.mode === 'dark'
          ? alpha('#ffffff', darkBackgroundAlpha)
          : alpha('#ffffff', lightBackgroundAlpha),
      transition: 'box-shadow 160ms ease, border-color 160ms ease, background-color 160ms ease',
      '& fieldset': {
        borderColor:
          theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(accent, 0.12),
      },
      '&:hover fieldset': {
        borderColor: alpha(accent, 0.22),
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 4px ${alpha(accent, 0.08)}`,
        backgroundColor:
          theme.palette.mode === 'dark' ? alpha('#ffffff', darkBackgroundAlpha + 0.01) : alpha('#ffffff', 0.94),
      },
      '&.Mui-focused fieldset': {
        borderColor: alpha(accent, 0.34),
        borderWidth: '1px',
      },
    },
  };
}

export function getStudioMenuPaperSx(theme) {
  return {
    borderRadius: 3,
    minWidth: 320,
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(18,24,36,0.96)' : 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(18px)',
  };
}
