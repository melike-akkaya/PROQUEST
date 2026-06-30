import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useLocation } from 'react-router-dom';
import posterPDF from '../../../assets/poster.pdf';
import demo from '../../../assets/demo.mp4';
import introduction from '../../../assets/intro.mp4';
import { FOOTER_LINKS, FOOTER_MEDIA, FOOTER_TEAM } from '../data';
import { getHomeTokens } from '../homeTokens';
import { STUDIO_MODULES } from '../../studio/constants';

const mediaSources = {
  poster: posterPDF,
  demo,
  intro: introduction,
};

const DEFAULT_FOOTER_ACCENT = '#5b7cff';
const moduleAccentMap = Object.fromEntries(STUDIO_MODULES.map((module) => [module.id, module.accent]));

export default function SiteFooter() {
  const theme = useTheme();
  const location = useLocation();
  const [activeMedia, setActiveMedia] = useState(null);
  const year = new Date().getFullYear();

  const footerAccent = useMemo(() => {
    if (location.pathname === '/studio') {
      const params = new URLSearchParams(location.search);
      const moduleId = params.get('module');
      return moduleAccentMap[moduleId] || DEFAULT_FOOTER_ACCENT;
    }

    if (location.pathname === '/query/vector') {
      return moduleAccentMap.vector;
    }

    if (location.pathname === '/query/llm') {
      return moduleAccentMap.llm;
    }

    if (location.pathname === '/query/rag') {
      return moduleAccentMap.rag;
    }

    return DEFAULT_FOOTER_ACCENT;
  }, [location.pathname, location.search]);

  const tokens = getHomeTokens(theme, footerAccent);

  const selectedMedia = useMemo(
    () => FOOTER_MEDIA.find((item) => item.key === activeMedia) || null,
    [activeMedia]
  );
  const selectedMediaSource = selectedMedia ? mediaSources[selectedMedia.key] : null;

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `${tokens.footerGlow}, ${tokens.background}`,
        pt: { xs: 6, md: 7 },
        pb: { xs: 4, md: 5 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: alpha(tokens.accent, theme.palette.mode === 'dark' ? 0.08 : 0.06),
          filter: 'blur(88px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            pt: { xs: 3, md: 4 },
            borderTop: `1px solid ${alpha(tokens.border, 0.95)}`,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)' },
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: alpha(tokens.accent, 0.86),
                }}
              >
                ProQuest
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 560,
                  fontSize: { xs: '1.28rem', md: '1.62rem' },
                  lineHeight: 1.12,
                  letterSpacing: '-0.04em',
                  fontWeight: 700,
                  fontFamily: '"Space Grotesk", "Sora", sans-serif',
                  color: tokens.text,
                }}
              >
                A clean interface for UniProt search, sequence retrieval, and retrieval-backed exploration.
              </Typography>
              <Typography
                sx={{
                  mt: 1.35,
                  maxWidth: 620,
                  fontSize: { xs: '0.95rem', md: '0.98rem' },
                  lineHeight: 1.85,
                  color: tokens.muted,
                }}
              >
                ProQuest combines natural-language querying, semantic sequence search, and RAG-based exploration
                in one focused UniProt workflow.
              </Typography>

              <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mt: 2.2 }}>
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                    underline="none"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.55,
                      fontWeight: 600,
                      color: tokens.text,
                      transition: 'color 160ms ease, transform 160ms ease',
                      '&:hover': {
                        color: tokens.accent,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    {link.label}
                    <ArrowOutwardRoundedIcon sx={{ fontSize: '1rem' }} />
                  </Link>
                ))}
              </Stack>
            </Box>

            <Box sx={{ width: '100%', maxWidth: 340, justifySelf: { xs: 'stretch', lg: 'end' } }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: alpha(tokens.accent, 0.86),
                }}
              >
                Resources
              </Typography>

              <Stack spacing={0.25} sx={{ mt: 1 }}>
                {FOOTER_MEDIA.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.key}
                      onClick={() => setActiveMedia(item.key)}
                      startIcon={<Icon sx={{ fontSize: '1rem' }} />}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 0,
                        py: 0.8,
                        minWidth: 0,
                        borderRadius: 0,
                        textTransform: 'none',
                        fontWeight: 600,
                        color: tokens.text,
                        borderBottom: `1px solid ${alpha(tokens.border, 0.92)}`,
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: tokens.accent,
                        },
                        '& .MuiButton-startIcon': {
                          mr: 1,
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              mt: { xs: 3.5, md: 4 },
              pt: { xs: 2.2, md: 2.4 },
              borderTop: `1px solid ${alpha(tokens.border, 0.92)}`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(180px, 0.38fr) minmax(0, 1fr)' },
              gap: { xs: 1.4, md: 2 },
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: alpha(tokens.accent, 0.86),
                }}
              >
                Team
              </Typography>
              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: '0.92rem',
                  lineHeight: 1.75,
                  color: tokens.muted,
                }}
              >
                HUBioDataLab
              </Typography>
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.05,
                }}
              >
                {FOOTER_TEAM.map((member) => (
                  <Box
                    key={member.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      py: 0.55,
                      borderBottom: `1px solid ${alpha(tokens.border, 0.72)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: tokens.text }}>
                      {member.url ? (
                        <Link href={member.url} target="_blank" rel="noreferrer" underline="hover" color="inherit">
                          {member.name}
                        </Link>
                      ) : (
                        member.name
                      )}
                    </Typography>
                    <Typography
                      sx={{
                        flexShrink: 0,
                        fontSize: '0.84rem',
                        color: tokens.muted,
                      }}
                    >
                      {member.role}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', color: tokens.muted }}>
                  Copyright {year} ProQuest
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: tokens.muted }}>
                  Minimal interface for protein exploration
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      <Dialog open={Boolean(selectedMedia)} onClose={() => setActiveMedia(null)} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {selectedMedia?.label}
          </Typography>
          <IconButton onClick={() => setActiveMedia(null)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 2 }}>
          {selectedMedia && selectedMediaSource ? (
            selectedMedia.type === 'pdf' ? (
              <Box
                component="iframe"
                src={selectedMediaSource}
                title={selectedMedia.label}
                width="100%"
                height="100%"
                sx={{ border: 'none', borderRadius: 2 }}
              />
            ) : (
              <Box
                component="video"
                src={selectedMediaSource}
                width="100%"
                height="100%"
                controls
                sx={{ borderRadius: 2 }}
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
