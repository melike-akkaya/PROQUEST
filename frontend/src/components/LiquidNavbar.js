import React, { useEffect, useRef, useState } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Brightness4RoundedIcon from '@mui/icons-material/Brightness4Rounded';
import Brightness7RoundedIcon from '@mui/icons-material/Brightness7Rounded';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
  {
    id: 'llm',
    label: 'ProteinSearch',
    gradientLight: 'linear-gradient(135deg, #2f8cff 0%, #69c6ff 100%)',
    gradientDark: 'linear-gradient(135deg, #4b98ff 0%, #7ad3ff 100%)',
  },
  {
    id: 'vector',
    label: 'SeqSim',
    gradientLight: 'linear-gradient(135deg, #3e9dff 0%, #5fd7a8 100%)',
    gradientDark: 'linear-gradient(135deg, #68b2ff 0%, #6fe2b8 100%)',
  },
  {
    id: 'rag',
    label: 'ProteinChat',
    gradientLight: 'linear-gradient(135deg, #658cff 0%, #8f8bff 100%)',
    gradientDark: 'linear-gradient(135deg, #7a93ff 0%, #9f97ff 100%)',
  },
];

function getActiveModule(location) {
  const params = new URLSearchParams(location.search);
  const studioModule = params.get('module');

  if (location.pathname.includes('/studio')) {
    return ['llm', 'vector', 'rag'].includes(studioModule) ? studioModule : 'rag';
  }

  if (location.pathname.includes('/query/llm')) return 'llm';
  if (location.pathname.includes('/query/vector')) return 'vector';
  if (location.pathname.includes('/query/rag')) return 'rag';

  return null;
}

export default function LiquidNavbar({ mode, toggleMode }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const activeModule = getActiveModule(location);
  const lastScrollY = useRef(0);
  const [showFloatingItems, setShowFloatingItems] = useState(true);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollingUp = nextScrollY < lastScrollY.current;
      const isNearTop = nextScrollY < 18;

      setShowFloatingItems(isNearTop || scrollingUp);
      setIsCondensed(nextScrollY > 28);
      lastScrollY.current = nextScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const segmentSurface = {
    border: `1px solid ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.14 : 0.82)}`,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha('#0e182c', 0.76)} 0%, ${alpha('#17263f', 0.62)} 100%)`
      : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fbff', 0.76)} 100%)`,
    backdropFilter: 'blur(24px) saturate(170%)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 18px 36px ${alpha('#020617', isCondensed ? 0.34 : 0.24)}`
      : `0 14px 28px ${alpha('#8ca0bf', isCondensed ? 0.16 : 0.09)}`,
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: { xs: 10, md: 16 },
        background: 'transparent',
        boxShadow: 'none',
        pointerEvents: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-16px 0 auto 0',
          height: 160,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(7,12,24,0.56) 0%, rgba(7,12,24,0.24) 44%, rgba(7,12,24,0) 100%)'
            : 'linear-gradient(180deg, rgba(244,248,255,0.9) 0%, rgba(244,248,255,0.38) 44%, rgba(244,248,255,0) 100%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ px: { xs: 1.25, md: 2.5 } }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: 'unset',
            width: '100%',
            maxWidth: 1240,
            mx: 'auto',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr auto', md: 'minmax(220px, 1fr) auto minmax(220px, 1fr)' },
              alignItems: 'center',
              gap: { xs: 1, md: 1.2 },
            }}
          >
            <Box
              sx={{
                ...segmentSurface,
                pointerEvents: 'auto',
                minWidth: 0,
                borderRadius: '999px',
                px: { xs: 1.4, md: 1.7 },
                py: { xs: 0.9, md: 1 },
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha('#111d34', 0.82)} 0%, ${alpha('#1b2743', 0.68)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#ffffff', 0.94)} 0%, ${alpha('#eef5ff', 0.84)} 100%)`,
                justifySelf: { md: 'start' },
              }}
            >
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 28, md: 32 },
                    height: { xs: 28, md: 32 },
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '50%',
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="logo"
                    sx={{
                      height: '100%',
                      width: 'auto',
                      display: 'block',
                      filter: theme.palette.mode === 'dark'
                        ? 'brightness(0) saturate(100%) invert(100%) sepia(0%) hue-rotate(180deg)'
                        : 'none',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Sora", "Space Grotesk", sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '1.04rem', md: '1.14rem' },
                    letterSpacing: '-0.06em',
                    color: theme.palette.mode === 'dark' ? '#f4f8ff' : '#162742',
                    whiteSpace: 'nowrap',
                  }}
                >
                  PROQUEST
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                ...segmentSurface,
                pointerEvents: showFloatingItems ? 'auto' : 'none',
                gridColumn: { xs: '1 / -1', md: 'auto' },
                justifySelf: 'center',
                width: { xs: '100%', md: 'auto' },
                borderRadius: '999px',
                px: { xs: 0.55, md: 0.72 },
                py: { xs: 0.55, md: 0.65 },
                overflowX: 'auto',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(90deg, ${alpha('#111d34', 0.84)} 0%, ${alpha('#1a2245', 0.74)} 45%, ${alpha('#102d2b', 0.74)} 100%)`
                  : `linear-gradient(90deg, ${alpha('#eef5ff', 0.92)} 0%, ${alpha('#f3efff', 0.88)} 48%, ${alpha('#eefbf4', 0.92)} 100%)`,
                transition: 'transform 240ms ease, opacity 240ms ease',
                transform: showFloatingItems ? 'translateY(0)' : 'translateY(-18px)',
                opacity: showFloatingItems ? 1 : 0,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.55,
                  minWidth: '100%',
                  justifyContent: { xs: 'space-between', md: 'center' },
                }}
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = item.id === activeModule;

                  return (
                    <Box
                      key={item.id}
                      component="button"
                      type="button"
                      onClick={() => navigate(`/query/${item.id}`)}
                      sx={{
                        appearance: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        px: { xs: 1.35, md: 2.1 },
                        py: { xs: 0.95, md: 1.05 },
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        fontFamily: '"Sora", "Space Grotesk", sans-serif',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: { xs: '0.82rem', md: '0.92rem' },
                        letterSpacing: '-0.03em',
                        color: isActive
                          ? '#ffffff'
                          : (theme.palette.mode === 'dark' ? '#d5e1f2' : '#3b4f6d'),
                        background: isActive
                          ? (theme.palette.mode === 'dark' ? item.gradientDark : item.gradientLight)
                          : 'transparent',
                        boxShadow: isActive
                          ? `0 10px 24px ${alpha('#0f172a', theme.palette.mode === 'dark' ? 0.34 : 0.14)}`
                          : 'none',
                        transition: 'transform 180ms ease, color 220ms ease, background 220ms ease, box-shadow 220ms ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          color: isActive ? '#ffffff' : (theme.palette.mode === 'dark' ? '#eef5ff' : '#22324a'),
                          background: isActive
                            ? (theme.palette.mode === 'dark' ? item.gradientDark : item.gradientLight)
                            : alpha('#ffffff', theme.palette.mode === 'dark' ? 0.08 : 0.46),
                          boxShadow: isActive
                            ? `0 10px 24px ${alpha('#0f172a', theme.palette.mode === 'dark' ? 0.28 : 0.12)}`
                            : 'none',
                        },
                      }}
                    >
                      {item.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box
              sx={{
                ...segmentSurface,
                pointerEvents: showFloatingItems ? 'auto' : 'none',
                justifySelf: 'end',
                width: { md: 'fit-content' },
                borderRadius: '999px',
                p: 0.45,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha('#112133', 0.8)} 0%, ${alpha('#113128', 0.62)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#f1fbf6', 0.96)} 0%, ${alpha('#eef7ff', 0.84)} 100%)`,
                transition: 'transform 240ms ease, opacity 240ms ease',
                transform: showFloatingItems ? 'translateY(0)' : 'translateY(-18px)',
                opacity: showFloatingItems ? 1 : 0,
              }}
            >
              <IconButton
                color="inherit"
                onClick={toggleMode}
                sx={{
                  width: { xs: 42, md: 46 },
                  height: { xs: 42, md: 46 },
                  color: theme.palette.mode === 'dark' ? '#eff6ff' : '#13233e',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.5) 100%)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.62) 100%)',
                  },
                }}
              >
                {mode === 'dark' ? <Brightness7RoundedIcon /> : <Brightness4RoundedIcon />}
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
}
