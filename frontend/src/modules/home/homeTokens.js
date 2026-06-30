import { alpha } from '@mui/material';

export function getHomeTokens(theme, accent = '#5b7cff') {
  const dark = theme.palette.mode === 'dark';

  return {
    background: dark
      ? 'linear-gradient(180deg, #0a1220 0%, #0d1726 100%)'
      : 'linear-gradient(180deg, #f4f8fc 0%, #edf3f9 100%)',
    heroGlow: dark
      ? 'radial-gradient(circle at top left, rgba(91,124,255,0.2) 0%, rgba(91,124,255,0) 34%), radial-gradient(circle at 85% 10%, rgba(79,138,118,0.14) 0%, rgba(79,138,118,0) 26%)'
      : 'radial-gradient(circle at top left, rgba(91,124,255,0.14) 0%, rgba(91,124,255,0) 36%), radial-gradient(circle at 85% 10%, rgba(79,138,118,0.1) 0%, rgba(79,138,118,0) 28%)',
    footerGlow: dark
      ? `radial-gradient(circle at 20% 0%, ${alpha(accent, 0.14)} 0%, ${alpha(accent, 0)} 26%), radial-gradient(circle at 80% 0%, ${alpha(accent, 0.08)} 0%, ${alpha(accent, 0)} 22%)`
      : `radial-gradient(circle at 20% 0%, ${alpha(accent, 0.1)} 0%, ${alpha(accent, 0)} 28%), radial-gradient(circle at 80% 0%, ${alpha(accent, 0.06)} 0%, ${alpha(accent, 0)} 24%)`,
    panelBackground: dark
      ? 'rgba(12, 18, 30, 0.88)'
      : 'rgba(255, 255, 255, 0.82)',
    panelBackgroundStrong: dark
      ? 'linear-gradient(160deg, rgba(13,20,31,0.95) 0%, rgba(10,15,25,0.98) 100%)'
      : 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(247,250,255,0.98) 100%)',
    border: dark ? alpha('#ffffff', 0.08) : alpha('#14355c', 0.08),
    text: dark ? '#f7faff' : '#11203b',
    muted: dark ? '#9caac0' : '#607089',
    accent,
    accentSoft: dark ? alpha(accent, 0.16) : alpha(accent, 0.1),
    shadow: dark ? `0 24px 52px ${alpha('#010409', 0.28)}` : `0 24px 52px ${alpha('#8aa4c4', 0.12)}`,
    sectionShadow: dark ? `0 18px 36px ${alpha('#010409', 0.18)}` : `0 18px 36px ${alpha('#8aa4c4', 0.08)}`,
  };
}

export function getPanelSx(tokens, extra = {}) {
  return {
    borderRadius: 5,
    border: `1px solid ${tokens.border}`,
    background: tokens.panelBackgroundStrong,
    backdropFilter: 'blur(18px)',
    boxShadow: tokens.shadow,
    ...extra,
  };
}
