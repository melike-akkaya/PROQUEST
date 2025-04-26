import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import { Organization } from './Organization';
import { TeamMembers } from './TeamMembers';

export default function Footer() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(15,15,15,0.9)'
          : '#f9f9f9',
        borderTop: theme => `1px solid ${theme.palette.divider}`, // 👈 Burada çizgiyi ekliyoruz
        backdropFilter: 'blur(10px)', // opsiyonel, daha zarif duruyor
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Organization />
        <Box mt={4}>
          <TeamMembers />
        </Box>
      </Container>
    </Box>
  );
}
