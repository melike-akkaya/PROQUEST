import { Box, Fade, useTheme } from '@mui/material';
import UniProtLogo from '../assets/uniprot.png';
import GOLogo from '../assets/go.png';

function HeroLogos() {
  const theme = useTheme();

  const logos = [
    {
      src: UniProtLogo,
      alt: 'UniProt',
      href: 'https://www.uniprot.org/',
    },
    {
      src: GOLogo,
      alt: 'Gene Ontology',
      href: 'https://geneontology.org/',
    },
  ];

  return (
    <Fade in timeout={1600}>
      <Box
        component="ul"
        sx={{
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          listStyle: 'none',
          p: 0,
          m: 0,
          mt: 8, 
        }}
      >
        {logos.map((logo, idx) => (
          <Box
            component="li"
            key={idx}
            sx={{
              width: 180,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: `0 4px 20px ${theme.palette.primary.main}33`,
              },
            }}
          >
            <Box
              component="a"
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'block', width: '100%' }}
            >
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{
                  width: '100%',
                  height: 'auto',
                  filter:
                    theme.palette.mode === 'dark'
                      ? 'brightness(0) invert(1)'
                      : 'none',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Fade>
  );
}

export default HeroLogos;
