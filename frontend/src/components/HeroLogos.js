import { Box, Fade, useTheme } from '@mui/material';
import UniProtLogo from '../assets/uniprot.png';
import GOLogo from '../assets/go.png';
import HULogo from '../assets/hu.png';
import EMBLogo from '../assets/embl.png';
import BioDataLabLogo from '../assets/biodatalab.png';

function HeroLogos() {
  const theme = useTheme();

  const logos = [
    { src: UniProtLogo, alt: 'UniProt', href: 'https://www.uniprot.org/' },
    { src: GOLogo, alt: 'Gene Ontology', href: 'https://geneontology.org/' },
    { src: EMBLogo, alt: 'EMBL', href: 'https://www.embl.org/' },
    { src: HULogo, alt: 'Hacettepe University', href: 'https://hacettepe.edu.tr/' },
    { src: BioDataLabLogo, alt: 'BioDataLab', href: 'https://github.com/HUBioDataLab/' }
  ];

  return (
    <Fade in timeout={1600}>
      <Box
        component="ul"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          listStyle: 'none',
          gap: { xs: 4, md: 6 },
          p: 0,
          m: 0,
          mt: 6,
        }}
      >
        {logos.map((logo, idx) => (
          <Box
            component="li"
            key={idx}
            sx={{
              width: { xs: 120, md: 160 },
              height: 100,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 6px 18px ${theme.palette.primary.main}44`,
              },
            }}
          >
            <Box
              component="a"
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                p: 1,
              }}
            >
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
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
