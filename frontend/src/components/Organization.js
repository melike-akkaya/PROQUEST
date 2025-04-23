import React from 'react';
import { Box, Typography, Link, Stack } from '@mui/material';

const orgLinks = [
  { label: 'GitHub', url: 'https://github.com/HUBioDataLab/PROQUEST' },
//   { label: 'Documentation', url: 'https://docs.proquest.bio' },
  { label: 'Contact Us', url: 'mailto:tuncadogan@gmail.com' },
];

export function Organization() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        About ProQuest
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        ProQuest is an open-source platform providing fast, accurate protein similarity searches
        with integrated functional insights. Our mission is to accelerate biological discovery
        through intuitive, natural-language search powered by state-of-the-art ML.
      </Typography>
      <Stack direction="row" spacing={2}>
        {orgLinks.map((link) => (
          <Link href={link.url} key={link.label} underline="hover" variant="button">
            {link.label}
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
