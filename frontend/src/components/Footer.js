import React from 'react';
import { Box, Container } from '@mui/material';
import { Organization } from './Organization';
import { TeamMembers } from './TeamMembers';

export default function Footer() {
  return (
    <Box sx={{ backgroundColor: 'background.paper', py: 6 }}>
      <Container maxWidth="lg">
        <Organization />
        <Box mt={4}>
          <TeamMembers />
        </Box>
      </Container>
    </Box>
  );
}
