import React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Collapse,
  Paper,
  Popper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';

import { getStudioSurfaceSx } from '../utils/studioStyles';

export default function ModuleIntroCard({ meta, mobile = false }) {
  const theme = useTheme();
  const cardRef = React.useRef(null);
  const hoverCloseTimeoutRef = React.useRef(null);
  const [desktopHowToUseOpen, setDesktopHowToUseOpen] = React.useState(false);
  const [mobileHowToUseOpen, setMobileHowToUseOpen] = React.useState(false);
  const baseSx = getStudioSurfaceSx(theme, meta.accent, {
    borderAlpha: 0.1,
    darkTint: mobile ? 0.08 : 0.12,
    lightTint: mobile ? 0.05 : 0.08,
  });
  const detailIconMap = {
    search: SearchRoundedIcon,
    flow: AutoAwesomeRoundedIcon,
    warning: PriorityHighRoundedIcon,
  };
  const howToUseOpen = mobile ? mobileHowToUseOpen : desktopHowToUseOpen;

  React.useEffect(() => () => {
    if (hoverCloseTimeoutRef.current) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
    }
  }, []);

  const handleMobileHowToUseToggle = () => {
    setMobileHowToUseOpen((current) => !current);
  };

  const openDesktopHowToUse = () => {
    if (hoverCloseTimeoutRef.current) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
    setDesktopHowToUseOpen(true);
  };

  const closeDesktopHowToUse = () => {
    if (hoverCloseTimeoutRef.current) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
    }

    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setDesktopHowToUseOpen(false);
      hoverCloseTimeoutRef.current = null;
    }, 110);
  };

  const howToUsePanel = meta.howToUse ? (
    <Paper
      elevation={0}
      sx={{
        width: mobile ? '100%' : 308,
        mt: mobile ? 1.1 : 0,
        ml: mobile ? 0 : 0,
        p: mobile ? 1.3 : 1.45,
        borderRadius: 4.2,
        border: `1px solid ${alpha(meta.accent, theme.palette.mode === 'dark' ? 0.18 : 0.12)}`,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(18,25,38,0.995) 0%, rgba(12,18,29,0.998) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.998) 0%, rgba(247,250,255,0.998) 100%)',
        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 20px 44px ${alpha('#000000', 0.24)}`
            : `0 20px 44px ${alpha(meta.accent, 0.1)}`,
      }}
      onMouseEnter={!mobile ? openDesktopHowToUse : undefined}
      onMouseLeave={!mobile ? closeDesktopHowToUse : undefined}
    >
      <Stack spacing={1.1}>
        <Stack direction="row" spacing={0.9} alignItems="center">
          <Box
            sx={{
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2.5,
              flexShrink: 0,
              color: alpha(meta.accent, 0.98),
              backgroundColor: alpha(meta.accent, theme.palette.mode === 'dark' ? 0.2 : 0.12),
            }}
          >
            <LightbulbOutlinedIcon sx={{ fontSize: 17 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: mobile ? '0.92rem' : '0.88rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: theme.palette.mode === 'dark' ? '#eef4ff' : '#183761',
              }}
            >
              {meta.howToUse.label}
            </Typography>
            <Typography
              sx={{
                mt: 0.2,
                fontSize: '0.74rem',
                color: theme.palette.mode === 'dark' ? '#9fb2cd' : '#73829b',
              }}
            >
              {meta.howToUse.subtitle || `Quick setup for ${meta.title}`}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={0.7}>
          {meta.howToUse.steps.map((step, index) => (
            <Box
              key={typeof step === 'string' ? step : `${step.lead}-${index}`}
              sx={{
                px: 1.05,
                py: 0.95,
                borderRadius: 3,
                border: `1px solid ${alpha(meta.accent, theme.palette.mode === 'dark' ? 0.12 : 0.08)}`,
                backgroundColor: alpha(meta.accent, theme.palette.mode === 'dark' ? 0.08 : 0.045),
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="flex-start">
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    mt: 0.75,
                    borderRadius: '999px',
                    flexShrink: 0,
                    backgroundColor: alpha(meta.accent, 0.92),
                    boxShadow: `0 0 0 4px ${alpha(meta.accent, theme.palette.mode === 'dark' ? 0.12 : 0.08)}`,
                  }}
                />
                <Typography
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#d5dfec' : '#44536b',
                    lineHeight: 1.55,
                    fontSize: mobile ? '0.88rem' : '0.84rem',
                  }}
                >
                  {typeof step === 'string' ? (
                    step
                  ) : (
                    <>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.mode === 'dark' ? '#f1f6ff' : '#1a365e',
                        }}
                      >
                        {step.lead}
                      </Box>{' '}
                      {step.body}
                    </>
                  )}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  ) : null;

  return (
    <Paper
      ref={cardRef}
      elevation={0}
      sx={{
        ...baseSx,
        p: mobile ? { xs: 2.05, md: 2.3 } : 2.2,
        overflow: 'visible',
      }}
    >
      <Stack spacing={1.05}>
        <Typography
          sx={{
            fontSize: '0.74rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: alpha(meta.accent, 0.95),
          }}
        >
          {meta.eyebrow}
        </Typography>
        <Typography
          sx={{
            fontSize: mobile ? { xs: '1.58rem', md: '1.82rem' } : '1.58rem',
            fontWeight: 700,
            letterSpacing: '-0.045em',
            color: theme.palette.mode === 'dark' ? '#f8fbff' : '#11203b',
            lineHeight: 1.04,
            fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
          }}
        >
          {meta.title}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.mode === 'dark' ? '#b6c4d8' : '#55627c',
            lineHeight: 1.62,
            fontSize: mobile ? '0.93rem' : '0.89rem',
          }}
        >
          {meta.description}
        </Typography>

        {meta.details?.length ? (
          <Stack spacing={1} sx={{ pt: 0.35 }}>
            {meta.details.map((detail, index) => {
              const Icon = detailIconMap[detail.tone];

              return (
                <Stack
                  key={`${detail.tone}-${index}`}
                  direction="row"
                  spacing={0.9}
                  alignItems="flex-start"
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      mt: 0.15,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '999px',
                      flexShrink: 0,
                      color: alpha(meta.accent, 0.96),
                      backgroundColor: alpha(meta.accent, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                    }}
                  >
                    {Icon ? <Icon sx={{ fontSize: 15 }} /> : null}
                  </Box>
                  <Typography
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#d6e0ee' : '#40506a',
                      lineHeight: 1.58,
                      fontSize: mobile ? '0.89rem' : '0.85rem',
                    }}
                  >
                    {detail.text}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        ) : null}

        {meta.howToUse ? (
          <Box
            sx={{ pt: 0.55, position: 'relative', alignSelf: 'flex-start' }}
            onMouseEnter={!mobile ? openDesktopHowToUse : undefined}
            onMouseLeave={!mobile ? closeDesktopHowToUse : undefined}
          >
            <Box
              component="button"
              type="button"
              onClick={mobile ? handleMobileHowToUseToggle : undefined}
              onFocus={!mobile ? openDesktopHowToUse : undefined}
              onBlur={!mobile ? closeDesktopHowToUse : undefined}
              sx={{
                p: 0,
                m: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: alpha(meta.accent, 0.94),
                textAlign: 'left',
                '&:hover .howto-label': {
                  color: alpha(meta.accent, 1),
                },
              }}
            >
              <LightbulbOutlinedIcon sx={{ fontSize: 17 }} />
              <Typography
                className="howto-label"
                sx={{
                  fontSize: mobile ? '0.91rem' : '0.86rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  transition: 'color 180ms ease',
                }}
              >
                {meta.howToUse.label}
              </Typography>
              {mobile ? (
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: alpha(meta.accent, 0.82),
                    transform: howToUseOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 180ms ease',
                  }}
                />
              ) : null}
            </Box>

            {mobile ? <Collapse in={howToUseOpen}>{howToUsePanel}</Collapse> : null}

            {!mobile ? (
              <Popper
                open={howToUseOpen}
                anchorEl={cardRef.current}
                placement="right-end"
                sx={{ zIndex: 20 }}
                modifiers={[
                  {
                    name: 'offset',
                    options: {
                      offset: [18, 0],
                    },
                  },
                ]}
              >
                {howToUsePanel}
              </Popper>
            ) : null}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}
