import React, { useState } from 'react';
import {
  Box,
  Typography,
  Link,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import posterPDF from '../assets/poster.pdf';

export function Organization() {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = () => setOpen(false);

  const orgLinks = [
    { label: 'GitHub', url: 'https://github.com/HUBioDataLab/PROQUEST' },
    { label: 'Contact Us', url: 'mailto:tuncadogan@gmail.com' },
  ];

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
          <Link key={link.label} href={link.url} underline="hover" variant="button">
            {link.label}
          </Link>
        ))}
        <Link component="button" variant="button" underline="hover" onClick={handleToggle}>
          Poster
        </Link>
      </Stack>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            px: 3,
            py: 2,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Poster Preview
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 2 }}>
          <Box
            component="iframe"
            src={posterPDF}
            width="100%"
            height="100%"
            sx={{ border: '1px solid #ccc', borderRadius: 1 }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
