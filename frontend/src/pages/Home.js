import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Fade, useTheme, alpha } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HeroLogos from '../components/HeroLogos';

function Hero({ onGetStarted }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(100,181,246,0.2) 0%, rgba(179,157,219,0.2) 100%)'
          : 'linear-gradient(135deg, rgba(0,113,227,0.05) 0%, rgba(94,92,230,0.05) 100%)',
        py: { xs: 6, md: 10 },
        mb: 6,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="lg">
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center">
          <Box flex="1">
            <Fade in timeout={1000}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2,
                  background: 'linear-gradient(90deg, #0071e3 0%, #5e5ce6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🧬 ProQuest
              </Typography>
            </Fade>
            <Fade in timeout={1200}>
              <Typography variant="h5" color="text.secondary" mb={4}>
                We developed a user-friendly interface that translates natural-language queries into precise Solr searches on UniProtKB-SwissProt database. Using ProtT5 embeddings and Annoy, our system enables fast protein similarity searches—up to 10x faster than BLAST—enriched with Gene Ontology insights for functional context.
              </Typography>
            </Fade>
            <Fade in timeout={1400}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #0071e3 0%, #5e5ce6 100%)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    transition: 'all 0.7s ease'
                  }}
                >
                  Start Querying
                </Button>
              </Box>
            </Fade>
          </Box>
          <Box
            flex="1"
            display={{ xs: 'none', md: 'block' }}
            position="relative"
            height="300px"
          >
            <HeroLogos />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function Features() {
  const theme = useTheme();
  const features = [
    { title: 'Vector Search', icon: '🔍' },
    { title: 'Multiple LLMs', icon: '🧠' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mb: 8 }}>
      <Typography variant="h3" fontWeight={600} textAlign="center" mb={2}>
        Key Features
      </Typography>
      <Box display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
        {features.map((f, i) => (
          <Fade in timeout={1000 + i * 200} key={f.title}>
            <Box
              textAlign="center"
              p={3}
              borderRadius="20px"
              border={`1px solid ${theme.palette.divider}`}
              sx={{
                width: 200,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Typography variant="h2" fontSize="2rem">{f.icon}</Typography>
              <Typography variant="h6" mt={1}>{f.title}</Typography>
            </Box>
          </Fade>
        ))}
      </Box>
    </Container>
  );
}

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <Hero onGetStarted={() => navigate('/query')} />
      <Features />
    </>
  );
}
