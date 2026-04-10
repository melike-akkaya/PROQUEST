import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
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

function formatTokenValue(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString()
    : 'n/a';
}

function TokenMetric({ label, value, accent, subdued = false }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.75,
        minWidth: 88,
        borderRadius: 2,
        border: `1px solid ${alpha(accent, subdued ? 0.14 : 0.18)}`,
        backgroundColor: alpha(accent, subdued ? 0.04 : 0.07),
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, mt: 0.15 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ChatBubble({ message, accent, onSuggestionClick }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const proteinIds = message.proteinIds || [];
  const tokenUsage = !isUser && message.tokenUsage && typeof message.tokenUsage === 'object'
    ? message.tokenUsage
    : null;
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

        {!!tokenUsage && (
          <Box
            sx={{
              mt: 1.6,
              p: 1.2,
              borderRadius: 3,
              border: `1px solid ${alpha(accent, 0.18)}`,
              backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.08 : 0.05),
            }}
          >
            <Stack spacing={1.1}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={0.75}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em', color: accent }}>
                  Token Usage
                </Typography>
                <Typography sx={{ fontSize: '0.73rem', opacity: 0.72 }}>
                  Source: {tokenUsage.source || 'unknown'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                <TokenMetric label="Total" value={formatTokenValue(tokenUsage.total_tokens)} accent={accent} />
                <TokenMetric label="Input" value={formatTokenValue(tokenUsage.input_tokens)} accent={accent} subdued />
                <TokenMetric label="Output" value={formatTokenValue(tokenUsage.output_tokens)} accent={accent} subdued />
                <TokenMetric
                  label="Attempts"
                  value={formatTokenValue(tokenUsage.attempt_count)}
                  accent={accent}
                  subdued
                />
              </Stack>

              {!!tokenUsage.attempts?.length && (
                <Stack spacing={0.9}>
                  {tokenUsage.attempts.map((attempt) => {
                    const breakdown = attempt.prompt_breakdown || {};
                    return (
                      <Box
                        key={`${message.id}-attempt-${attempt.attempt ?? attempt.top_k}`}
                        sx={{
                          p: 1,
                          borderRadius: 2.5,
                          border: `1px solid ${alpha(accent, 0.14)}`,
                          backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.05 : 0.035),
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={0.5}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            justifyContent="space-between"
                          >
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>
                              Attempt {attempt.attempt ?? '?'} • top_k {attempt.top_k ?? '?'} • {attempt.status || 'unknown'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', opacity: 0.66 }}>
                              {attempt.retrieval_mode || 'rag'} • {formatTokenValue(attempt.retrieved_document_count)} docs
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                            <TokenMetric label="Total" value={formatTokenValue(attempt.total_tokens)} accent={accent} subdued />
                            <TokenMetric label="Input" value={formatTokenValue(attempt.input_tokens)} accent={accent} subdued />
                            <TokenMetric label="Output" value={formatTokenValue(attempt.output_tokens)} accent={accent} subdued />
                          </Stack>

                          <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                            <TokenMetric
                              label="System est."
                              value={formatTokenValue(breakdown.system_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                            <TokenMetric
                              label="History est."
                              value={formatTokenValue(breakdown.chat_history_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                            <TokenMetric
                              label="Question est."
                              value={formatTokenValue(breakdown.question_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                            <TokenMetric
                              label="Docs est."
                              value={formatTokenValue(breakdown.documents_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                            <TokenMetric
                              label="Overhead est."
                              value={formatTokenValue(breakdown.template_overhead_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                            <TokenMetric
                              label="Prompt est."
                              value={formatTokenValue(breakdown.prompt_tokens_estimate)}
                              accent={accent}
                              subdued
                            />
                          </Stack>

                          {!!attempt.error && (
                            <Typography sx={{ fontSize: '0.72rem', color: theme.palette.error.main }}>
                              {attempt.error}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Box>
        )}

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
