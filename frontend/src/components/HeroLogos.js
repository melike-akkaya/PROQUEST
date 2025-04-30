import { Box, Fade, useTheme } from '@mui/material';
import UniProtLogo from '../assets/uniprot.png';
import GOLogo from '../assets/go.png';
import HULogo from '../assets/hu.png';
import EMBLogo from '../assets/embl.png';
import BioDataLabLogo from '../assets/biodatalab.png';

function HeroLogos() {
  const theme = useTheme();

  const upperRowLogos = [
    { src: BioDataLabLogo, alt: 'BioDataLab', href: 'https://github.com/HUBioDataLab/' },
    { src: HULogo, alt: 'Hacettepe University', href: 'https://hacettepe.edu.tr/' }
  ];

  const lowerRowLogos = [
    { src: UniProtLogo, alt: 'UniProt', href: 'https://www.uniprot.org/' },
    { src: GOLogo, alt: 'Gene Ontology', href: 'https://geneontology.org/' },
    { src: EMBLogo, alt: 'EMBL', href: 'https://www.ebi.ac.uk/' },
  ];

  const renderLogo = (logo, idx) => (
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
  );

  return (
    <Fade in timeout={1600}>
      <Box sx={{ mt: 6 }}>
        {[upperRowLogos, lowerRowLogos].map((group, rowIdx) => (
          <Box
            key={rowIdx}
            component="ul"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              listStyle: 'none',
              gap: { xs: 4, md: 6 },
              p: 0,
              m: 0,
              mb: rowIdx === 0 ? 4 : 0,
              flexWrap: 'nowrap',
            }}
          >
            {group.map(renderLogo)}
          </Box>
        ))}
      </Box>
    </Fade>
  );
}

export default HeroLogos;
