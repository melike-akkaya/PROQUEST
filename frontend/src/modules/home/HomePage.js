import React, { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import HeroLogos from '../../components/HeroLogos';
import { HOME_HERO_SLIDES, HOME_MODULES, HOME_STATS } from './data';
import { getHomeTokens, getPanelSx } from './homeTokens';

const driftLeftGlow = keyframes`
  0% { transform: translate3d(-2%, -2%, 0) scale(1); }
  50% { transform: translate3d(3%, 2%, 0) scale(1.04); }
  100% { transform: translate3d(-2%, -2%, 0) scale(1); }
`;

const driftRightGlow = keyframes`
  0% { transform: translate3d(2%, -1%, 0) scale(1); }
  50% { transform: translate3d(-3%, 3%, 0) scale(1.05); }
  100% { transform: translate3d(2%, -1%, 0) scale(1); }
`;

const driftTopGlow = keyframes`
  0% { transform: translate3d(0, -2%, 0) scale(1); }
  50% { transform: translate3d(2%, 3%, 0) scale(1.03); }
  100% { transform: translate3d(0, -2%, 0) scale(1); }
`;

function ModuleCard({ moduleItem, textColor, mutedColor, onOpen }) {
  const Icon = moduleItem.icon;

  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        cursor: 'pointer',
        border: `1px solid ${alpha(moduleItem.accent, 0.14)}`,
        background: `linear-gradient(160deg, ${alpha(moduleItem.accent, 0.08)} 0%, rgba(255,255,255,0) 100%)`,
        transition: 'transform 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: alpha(moduleItem.accent, 0.3),
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 3,
          color: moduleItem.accent,
          backgroundColor: alpha(moduleItem.accent, 0.12),
        }}
      >
        <Icon fontSize="small" />
      </Box>

      <Typography
        sx={{
          mt: 2,
          fontSize: '1.1rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: textColor,
        }}
      >
        {moduleItem.title}
      </Typography>

      <Typography
        sx={{
          mt: 1,
          lineHeight: 1.7,
          color: mutedColor,
        }}
      >
        {moduleItem.description}
      </Typography>

      <Button
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{
          mt: 'auto',
          pt: 2,
          px: 0,
          textTransform: 'none',
          fontWeight: 700,
          color: moduleItem.accent,
        }}
      >
        Open module
      </Button>
    </Paper>
  );
}

export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const tokens = getHomeTokens(theme);
  const [proteinCount, setProteinCount] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroCycleSeed, setHeroCycleSeed] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const targetValue = 500000;
    let frameId;
    let startTime;

    const tick = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setProteinCount(Math.round(targetValue * easedProgress));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveHeroSlide((current) => (current + 1) % HOME_HERO_SLIDES.length);
    }, 6200);

    return () => window.clearTimeout(timeoutId);
  }, [activeHeroSlide, heroCycleSeed]);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `${tokens.heroGlow}, ${tokens.background}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-14%',
          left: '-8%',
          width: { xs: 280, md: 420 },
          height: { xs: 280, md: 420 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#4f7dff', theme.palette.mode === 'dark' ? 0.12 : 0.08)} 0%, ${alpha('#4f7dff', 0)} 68%)`,
          filter: 'blur(28px)',
          animation: `${driftLeftGlow} 26s ease-in-out infinite`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: { xs: 260, md: 380 },
          height: { xs: 260, md: 380 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#4f8a76', theme.palette.mode === 'dark' ? 0.1 : 0.07)} 0%, ${alpha('#4f8a76', 0)} 70%)`,
          filter: 'blur(26px)',
          animation: `${driftRightGlow} 30s ease-in-out infinite`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: '-18%',
          left: '32%',
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#7283ec', theme.palette.mode === 'dark' ? 0.08 : 0.055)} 0%, ${alpha('#7283ec', 0)} 72%)`,
          filter: 'blur(24px)',
          animation: `${driftTopGlow} 34s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 15, md: 18 }, pb: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)' },
            gap: 3,
            alignItems: { xs: 'center', lg: 'stretch' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              alignItems: { xs: 'stretch', lg: 'center' },
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 640,
                flex: { lg: 1 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: { xs: 'flex-start', lg: 'center' },
                alignItems: { xs: 'stretch', lg: 'center' },
              }}
            >
              <Chip
                icon={<BiotechRoundedIcon sx={{ color: 'inherit !important' }} />}
                label="ProteinSearch, SeqSim, and ProteinChat in one place"
                sx={{
                  mb: 2.5,
                  height: 38,
                  alignSelf: { xs: 'flex-start', lg: 'center' },
                  borderRadius: '999px',
                  color: tokens.text,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.panelBackground,
                }}
              />

              <Typography
                component="h1"
                sx={{
                  maxWidth: 920,
                  fontSize: { xs: '1.62rem', sm: '2rem', md: '2.5rem', lg: '2.75rem' },
                  lineHeight: { xs: 1.14, md: 1.06 },
                  letterSpacing: '-0.045em',
                  fontWeight: 800,
                  fontFamily: '"Sora", "Space Grotesk", sans-serif',
                  color: tokens.text,
                  textAlign: { xs: 'left', lg: 'center' },
                  textWrap: 'balance',
                }}
              >
                ProQuest: LLM-powered semantic exploration of the Universal Protein Resource{' '}
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: { xs: 0.68, md: 0.82 },
                    py: { xs: 0.11, md: 0.15 },
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                    fontSize: '0.58em',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                    color: tokens.accent,
                    backgroundColor: tokens.accentSoft,
                    border: `1px solid ${alpha(tokens.accent, theme.palette.mode === 'dark' ? 0.24 : 0.16)}`,
                    boxShadow: `inset 0 1px 0 ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.06 : 0.55)}`,
                  }}
                >
                  UniProt
                </Box>
              </Typography>
            </Box>

            <Box sx={{ mt: { xs: 3.4, lg: 'auto' }, width: '100%', maxWidth: 620 }}>
              <Box sx={{ position: 'relative', minHeight: { xs: 86, sm: 98 } }}>
                {HOME_HERO_SLIDES.map((slide, index) => {
                  const isActive = index === activeHeroSlide;
                  const Icon = slide.icon;

                  return (
                    <Button
                      key={slide.path}
                      variant="contained"
                      size="large"
                      onClick={() => navigate(slide.path)}
                      tabIndex={isActive ? 0 : -1}
                      aria-hidden={!isActive}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left',
                        px: { xs: 2.1, sm: 2.6 },
                        py: { xs: 1.05, sm: 1.2 },
                        minHeight: { xs: 86, sm: 98 },
                        borderRadius: '24px',
                        textTransform: 'none',
                        color: '#fff',
                        cursor: isActive ? 'pointer' : 'default',
                        border: `1px solid ${isActive ? alpha('#ffffff', 0.16) : 'transparent'}`,
                        background: `linear-gradient(135deg, ${slide.accent} 0%, ${alpha(slide.accent, 0.8)} 100%)`,
                        boxShadow: `0 24px 44px ${alpha(slide.accent, isActive ? 0.16 : 0.08)}`,
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0px)' : 'translateY(18px)',
                        pointerEvents: isActive ? 'auto' : 'none',
                        transition: `
                          opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1),
                          transform 1200ms cubic-bezier(0.22, 1, 0.36, 1),
                          box-shadow 260ms ease,
                          border-color 260ms ease
                        `,
                        '&:hover': {
                          boxShadow: `0 30px 54px ${alpha(slide.accent, 0.22)}`,
                          borderColor: alpha('#ffffff', 0.24),
                          transform: 'translateY(-3px)',
                        },
                        '&:hover .hero-arrow': {
                          transform: 'translateX(4px)',
                          backgroundColor: alpha('#ffffff', 0.18),
                        },
                        '&:hover .hero-icon': {
                          color: alpha('#ffffff', 0.68),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.35} alignItems="center" sx={{ minWidth: 0, pr: 1.2, flex: 1 }}>
                        <Icon
                          className="hero-icon"
                          sx={{
                            fontSize: { xs: 22, sm: 26 },
                            flexShrink: 0,
                            color: alpha('#ffffff', 0.38),
                            transition: 'color 260ms ease',
                          }}
                        />

                        <Typography
                          sx={{
                            minWidth: 0,
                            display: 'block',
                            fontSize: { xs: '1.04rem', sm: '1.18rem', lg: '1.32rem' },
                            lineHeight: 1.08,
                            letterSpacing: '-0.03em',
                            fontWeight: 700,
                            fontFamily: '"Sora", "Space Grotesk", sans-serif',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {slide.sentence}
                        </Typography>
                      </Stack>

                      <Box
                        className="hero-arrow"
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '999px',
                          flexShrink: 0,
                          color: alpha('#ffffff', 0.86),
                          backgroundColor: alpha('#ffffff', 0.1),
                          transition: 'transform 260ms ease, background-color 260ms ease',
                        }}
                      >
                        <ArrowForwardRoundedIcon sx={{ fontSize: { xs: 21, sm: 23 } }} />
                      </Box>
                    </Button>
                  );
                })}
              </Box>

              <Stack direction="row" spacing={0.9} justifyContent="center" sx={{ mt: 1.4 }}>
                {HOME_HERO_SLIDES.map((slide, index) => {
                  const isActive = index === activeHeroSlide;

                  return (
                    <Box
                      key={slide.path}
                      component="button"
                      type="button"
                      onClick={() => {
                        setActiveHeroSlide(index);
                        setHeroCycleSeed((current) => current + 1);
                      }}
                      aria-label={`Show slide ${index + 1}`}
                      sx={{
                        width: isActive ? 22 : 8,
                        height: 8,
                        p: 0,
                        border: 'none',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? slide.accent : alpha(tokens.text, 0.16),
                        boxShadow: isActive ? `0 0 0 5px ${alpha(slide.accent, 0.12)}` : 'none',
                        transition: 'all 320ms ease',
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={getPanelSx(tokens, {
              minHeight: { xs: 340, md: 440 },
              overflow: 'hidden',
              p: { xs: 2.5, md: 3.25 },
              display: 'flex',
              alignItems: 'center',
            })}
          >
            <Box sx={{ width: '100%', minHeight: { xs: 220, md: 260 }, display: 'flex', alignItems: 'center' }}>
              <HeroLogos />
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            mt: { xs: 4.5, md: 5.5 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {HOME_STATS.map((item, index) => (
            <Paper
              key={item.label}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(item.accent, theme.palette.mode === 'dark' ? 0.22 : 0.12)}`,
                background: `linear-gradient(180deg, ${alpha(item.accent, theme.palette.mode === 'dark' ? 0.16 : 0.07)} 0%, ${tokens.panelBackground} 78%)`,
                boxShadow: tokens.sectionShadow,
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: tokens.text,
                }}
              >
                {index === 0 ? `${new Intl.NumberFormat('tr-TR').format(proteinCount)}+` : item.value}
              </Typography>
              <Typography sx={{ mt: 0.5, color: tokens.muted }}>
                {item.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ mt: { xs: 6, md: 7 } }}>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: alpha(tokens.accent, 0.9),
            }}
          >
            Explore
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: { xs: '1.7rem', md: '2.2rem' },
              lineHeight: 1.04,
              letterSpacing: '-0.05em',
              fontWeight: 700,
              fontFamily: '"Space Grotesk", "Sora", sans-serif',
              color: tokens.text,
            }}
          >
            Choose the workflow you want to start with.
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {HOME_MODULES.map((moduleItem) => (
              <ModuleCard
                key={moduleItem.title}
                moduleItem={moduleItem}
                textColor={tokens.text}
                mutedColor={tokens.muted}
                onOpen={() => navigate(moduleItem.path)}
              />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
