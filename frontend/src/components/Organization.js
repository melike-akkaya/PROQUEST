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
import demo from '../assets/demo.mp4';
import introduction from '../assets/intro.mp4';


export function Organization() {
  const [openPoster, setOpenPoster] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const [openIntro, setOpenIntro] = useState(false);

  const handleTogglePoster = () => setOpenPoster((prev) => !prev);
  const handleToggleDemo = () => setOpenDemo((prev) => !prev);
  const handleToggleIntro = () => setOpenIntro((prev) => !prev);

  const handleClosePoster = () => setOpenPoster(false);
  const handleCloseDemo = () => setOpenDemo(false);
  const handleCloseIntro = () => setOpenIntro(false)

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
       <Link component="button" variant="button" underline="hover" onClick={handleTogglePoster}>
          Poster
        </Link>
        <Link component="button" variant="button" underline="hover" onClick={handleToggleDemo}>
          Demo
        </Link>
        <Link component="button" variant="button" underline="hover" onClick={handleToggleIntro}>
          Introduction
        </Link>
      </Stack>

      {/* Poster Dialog */}
      <Dialog open={openPoster} onClose={handleClosePoster} maxWidth="lg" fullWidth>
        <DialogTitle sx={dialogTitleStyle}>
          <Typography variant="h6" fontWeight={600}>Poster Preview</Typography>
          <IconButton onClick={handleClosePoster}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={dialogContentStyle}>
          <Box
            component="iframe"
            src={posterPDF}
            width="100%"
            height="100%"
            sx={{ border: '1px solid #ccc', borderRadius: 1 }}
          />
        </DialogContent>
      </Dialog>

      {/* Demo Dialog */}
      <Dialog open={openDemo} onClose={handleCloseDemo} maxWidth="lg" fullWidth>
        <DialogTitle sx={dialogTitleStyle}>
          <Typography variant="h6" fontWeight={600}>Demo Video</Typography>
          <IconButton onClick={handleCloseDemo}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={dialogContentStyle}>
          <Box
            component="video"
            src={demo}
            width="100%"
            height="100%"
            controls
            sx={{ borderRadius: 1 }}
          />
        </DialogContent>
      </Dialog>

      {/* Introduction Dialog */}
      <Dialog open={openIntro} onClose={handleCloseIntro} maxWidth="lg" fullWidth>
        <DialogTitle sx={dialogTitleStyle}>
          <Typography variant="h6" fontWeight={600}>Introduction Video</Typography>
          <IconButton onClick={handleCloseIntro}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={dialogContentStyle}>
          <Box
            component="video"
            src={introduction}
            width="100%"
            height="100%"
            controls
            sx={{ borderRadius: 1 }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

const dialogTitleStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  bgcolor: 'background.paper',
  px: 3,
  py: 2,
  borderBottom: '1px solid #e0e0e0',
};

const dialogContentStyle = {
  height: '80vh',
  p: 2,
};
