import React from 'react';
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
import { HOME_MODULES, HOME_STATS } from './data';
import { getHomeTokens, getPanelSx } from './homeTokens';

function ModuleCard({ moduleItem, textColor, mutedColor, onOpen }) {
  const Icon = moduleItem.icon;

  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      sx={{
        p: 2.5,
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
          mt: 2,
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

  return (
    <Box
      sx={{
        background: `${tokens.heroGlow}, ${tokens.background}`,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: { xs: 15, md: 18 }, pb: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          <Box>
            <Chip
              icon={<BiotechRoundedIcon sx={{ color: 'inherit !important' }} />}
              label="Protein search, sequence retrieval, and RAG in one place"
              sx={{
                mb: 2.5,
                height: 38,
                borderRadius: '999px',
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.panelBackground,
              }}
            />

            <Typography
              variant="h1"
              sx={{
                maxWidth: 640,
                fontSize: { xs: '2.4rem', md: '4.1rem' },
                lineHeight: { xs: 1.08, md: 0.98 },
                letterSpacing: '-0.06em',
                fontWeight: 800,
                fontFamily: '"Sora", "Space Grotesk", sans-serif',
                color: tokens.text,
              }}
            >
              Modern, clear protein discovery.
            </Typography>

            <Typography
              sx={{
                mt: 2.25,
                maxWidth: 580,
                fontSize: { xs: '1rem', md: '1.08rem' },
                lineHeight: 1.8,
                color: tokens.muted,
              }}
            >
              ProQuest brings UniProt query building, vector similarity search, and retrieval-backed
              chat into a single, cleaner workflow.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3.5, maxWidth: 460 }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate('/studio?module=rag')}
                sx={{
                  flex: 1,
                  minHeight: 52,
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4f7dff 0%, #7283ec 100%)',
                  boxShadow: `0 18px 30px ${alpha('#4f7dff', 0.22)}`,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f7dff 0%, #7283ec 100%)',
                  },
                }}
              >
                Start Chat
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/studio?module=vector')}
                sx={{
                  flex: 1,
                  minHeight: 52,
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  color: tokens.text,
                  borderColor: tokens.border,
                  backgroundColor: tokens.panelBackground,
                  '&:hover': {
                    borderColor: alpha(tokens.accent, 0.28),
                    backgroundColor: tokens.panelBackground,
                  },
                }}
              >
                Explore Vector Search
              </Button>
            </Stack>
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
            mt: 3,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {HOME_STATS.map((item) => (
            <Paper
              key={item.label}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${tokens.border}`,
                background: tokens.panelBackground,
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
                {item.value}
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
