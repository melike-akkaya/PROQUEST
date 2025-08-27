import { Box, Fade, useTheme, Typography, Grid } from '@mui/material';
import UniProtLogo from '../assets/uniprot.png';
import GOLogo from '../assets/go.png';
import HULogo from '../assets/hu.png';
import EMBLogo from '../assets/embl.png';
import BioDataLabLogo from '../assets/biodatalab.png';

function HeroLogos() {
  const theme = useTheme();

  // ortak stil
  const commonImgSx = {
    height: { xs: 44, md: 56 },
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
  };

  // özel stiller
  const projectByImgSx = { height: { xs: 52, md: 72 } }; // daha büyük
  const emblImgSx = { height: { xs: 34, md: 44 } };      // daha yatay logo, biraz daha küçük

  const Tile = ({ title, logos }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1, md: 2 },
      }}
    >
      <Typography
        variant="overline"
        sx={{ letterSpacing: 1, opacity: 0.8, textAlign: 'center' }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 3, md: 4 },
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {logos.map((logo, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.25s, box-shadow 0.25s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 18px ${theme.palette.primary.main}33`,
              },
            }}
          >
            <Box
              component="a"
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{ ...commonImgSx, ...(logo.imgSx || {}) }}
              />
            </Box>
            {logo.caption && (
              <Typography variant="caption" sx={{ opacity: 0.8, textAlign: 'center' }}>
                {logo.caption}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Fade in timeout={1600}>
      <Box sx={{ mt: 6 }}>
        <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
          {/* Project by */}
          <Grid item xs={12} md={4}>
            <Tile
              title="Project by"
              logos={[
                { src: BioDataLabLogo, alt: 'BioDataLab', href: 'https://github.com/HUBioDataLab/', imgSx: projectByImgSx },
                { src: HULogo, alt: 'Hacettepe University', href: 'https://hacettepe.edu.tr/', imgSx: projectByImgSx },
              ]}
            />
          </Grid>

          {/* Data sources */}
          <Grid item xs={12} md={4}>
            <Tile
              title="Data sources"
              logos={[
                { src: UniProtLogo, alt: 'UniProt', href: 'https://www.uniprot.org/', caption: 'Protein Knowledgebase' },
                { src: GOLogo, alt: 'Gene Ontology', href: 'https://geneontology.org/', caption: 'Functional Annotations' },
              ]}
            />
          </Grid>

          {/* Collaborator */}
          <Grid item xs={12} md={4}>
            <Tile
              title="Collaborator"
              logos={[
                { src: EMBLogo, alt: 'EMBL-EBI', href: 'https://www.ebi.ac.uk/', imgSx: emblImgSx },
              ]}
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}

export default HeroLogos;
