import React from 'react';
import { Box, Stack } from '@mui/material';

import ModuleIntroCard from './ModuleIntroCard';

export default function ModuleFrame({ meta, showMobileIntro = true, rightSidebar = null, children }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1560,
        mx: 'auto',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '250px minmax(0, 1040px) 250px' },
        gap: { xs: 3, lg: 5 },
        alignItems: 'start',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: 108,
          transform: { xl: 'translateX(-18px)' },
        }}
      >
        <ModuleIntroCard meta={meta} />
      </Box>

      <Stack spacing={3} sx={{ width: '100%', maxWidth: 1040, mx: 'auto' }}>
        {showMobileIntro ? (
          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <ModuleIntroCard meta={meta} mobile />
          </Box>
        ) : null}
        {children}
      </Stack>

      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: rightSidebar ? 'sticky' : 'static',
          top: rightSidebar ? 108 : 'auto',
        }}
      >
        {rightSidebar}
      </Box>
    </Box>
  );
}
