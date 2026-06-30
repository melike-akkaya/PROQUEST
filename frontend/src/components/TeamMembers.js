import React from 'react';
import { Box, Typography, Grid, Paper, Link } from '@mui/material';

const members = [
  { name: 'Sezin Yavuz', role: 'Student' },
  { name: 'Rauf Yanmaz', role: 'Student' },
  { name: 'Melike Akkaya', role: 'Student' },
  {
    name: 'Tunca Doğan',
    role: 'Supervisor',
    url: 'https://yunus.hacettepe.edu.tr/~tuncadogan/',
  },
];

export function TeamMembers() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Our Team
      </Typography>
      <Grid container spacing={3}>
        {members.map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.name}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={500}>
                {m.url ? (
                  <Link
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {m.name}
                  </Link>
                ) : (
                  m.name
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {m.role}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}