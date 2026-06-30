import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';

export default function ChatBubble({ message, accent, onSuggestionClick }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const proteinIds = message.proteinIds || [];
  const sequencePreview = useMemo(() => {
    if (!message.sequence) {
      return '';
    }

    return message.sequence.length > 88
      ? `${message.sequence.slice(0, 88)}...`
      : message.sequence;
  }, [message.sequence]);

  async function handleCopySequence() {
    if (!message.sequence) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.sequence);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (_) {
      setCopied(false);
    }
  }

  return (
    <Stack
      direction={isUser ? 'row-reverse' : 'row'}
      spacing={1}
      alignItems="flex-start"
      sx={{ width: '100%' }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          mt: 0.25,
          flexShrink: 0,
          bgcolor: isUser ? '#11203b' : alpha(accent, 0.18),
          color: isUser ? '#fff' : accent,
        }}
      >
        {isUser ? <PersonRoundedIcon fontSize="small" /> : <SmartToyRoundedIcon fontSize="small" />}
      </Avatar>

      <Paper
        elevation={0}
        sx={{
          maxWidth: 'min(860px, 100%)',
          p: { xs: 1.7, md: 1.9 },
          borderRadius: 4,
          border: `1px solid ${isUser ? 'rgba(17,32,59,0.16)' : alpha(accent, 0.24)}`,
          background: isUser
            ? (theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(42,62,96,0.98) 0%, rgba(31,46,74,0.98) 100%)'
                : 'linear-gradient(180deg, rgba(17,32,59,0.98) 0%, rgba(30,47,77,0.98) 100%)')
            : (theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${alpha(accent, 0.16)} 0%, rgba(20,27,39,0.97) 100%)`
                : `linear-gradient(180deg, ${alpha(accent, 0.13)} 0%, rgba(250,251,255,0.98) 100%)`),
          color: isUser ? '#f7f9fc' : theme.palette.mode === 'dark' ? '#e3eaf5' : '#132238',
          boxShadow: isUser
            ? '0 24px 60px rgba(8, 14, 28, 0.22)'
            : `0 20px 44px ${alpha(accent, 0.08)}`,
        }}
      >
        <Typography
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.68,
            fontSize: { xs: '0.93rem', md: '0.95rem' },
          }}
        >
          {message.content}
        </Typography>

        {!!message.sequence && isUser && (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              mt: 1.4,
              px: 1.1,
              py: 0.7,
              borderRadius: 999,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.12)',
              width: 'fit-content',
              maxWidth: '100%',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.77rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                opacity: 0.82,
              }}
            >
              SEQ
            </Typography>
            <Typography
              sx={{
                fontSize: '0.79rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: 180, md: 360 },
                opacity: 0.92,
              }}
            >
              {sequencePreview}
            </Typography>
            <Tooltip title={copied ? 'Copied' : 'Copy sequence'}>
              <IconButton
                size="small"
                onClick={handleCopySequence}
                sx={{ color: 'inherit', width: 26, height: 26 }}
              >
                {copied ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                <Typography sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxWidth: 320 }}>
                  {message.sequence}
                </Typography>
              }
              placement="top"
              arrow
            >
              <IconButton size="small" sx={{ color: 'inherit', width: 26, height: 26 }}>
                <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {!!proteinIds.length && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.75 }}>
            {proteinIds.slice(0, 6).map((proteinId) => (
              <Chip
                key={proteinId}
                label={proteinId}
                size="small"
                component="a"
                clickable
                href={`https://www.uniprot.org/uniprotkb/${proteinId}`}
                target="_blank"
                rel="noreferrer"
                sx={{
                  fontWeight: 700,
                  color: accent,
                  backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                }}
              />
            ))}
            {proteinIds.length > 6 && (
              <Chip
                label={`+${proteinIds.length - 6} more`}
                size="small"
                sx={{ backgroundColor: 'rgba(17,32,59,0.08)' }}
              />
            )}
          </Stack>
        )}

        {!!message.suggestions?.length && !isUser && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            {message.suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                size="small"
                variant="outlined"
                onClick={() => onSuggestionClick?.(suggestion)}
              sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  color: accent,
                  borderColor: alpha(accent, 0.24),
                  backgroundColor: alpha(accent, 0.04),
                  fontSize: '0.82rem',
                  '&:hover': {
                    borderColor: accent,
                    backgroundColor: alpha(accent, 0.08),
                  },
                }}
              >
                {suggestion}
              </Button>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
