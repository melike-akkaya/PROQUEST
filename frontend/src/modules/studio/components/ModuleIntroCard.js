import React from 'react';
import { Paper, Stack, Typography, alpha, useTheme } from '@mui/material';

import { getStudioSurfaceSx } from '../utils/studioStyles';

export default function ModuleIntroCard({ meta, mobile = false }) {
  const theme = useTheme();
  const baseSx = getStudioSurfaceSx(theme, meta.accent, {
    borderAlpha: 0.1,
    darkTint: mobile ? 0.08 : 0.12,
    lightTint: mobile ? 0.05 : 0.08,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        ...baseSx,
        p: mobile ? { xs: 2.15, md: 2.4 } : 2.35,
      }}
    >
      <Stack spacing={1.15}>
        <Typography
          sx={{
            fontSize: '0.74rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: alpha(meta.accent, 0.95),
          }}
        >
          {meta.eyebrow}
        </Typography>
        <Typography
          sx={{
            fontSize: mobile ? { xs: '1.65rem', md: '1.9rem' } : '1.65rem',
            fontWeight: 700,
            letterSpacing: '-0.045em',
            color: theme.palette.mode === 'dark' ? '#f8fbff' : '#11203b',
            lineHeight: 1.04,
            fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
          }}
        >
          {meta.title}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.mode === 'dark' ? '#b6c4d8' : '#55627c',
            lineHeight: 1.68,
            fontSize: mobile ? '0.97rem' : '0.94rem',
          }}
        >
          {meta.description}
        </Typography>
      </Stack>
    </Paper>
  );
}
