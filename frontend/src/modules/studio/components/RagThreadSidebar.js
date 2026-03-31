import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import { getRagThreadMeta } from '../utils/ragThreadStorage';
import { getStudioSurfaceSx } from '../utils/studioStyles';

function formatTimestamp(value) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export default function RagThreadSidebar({
  accent,
  activeThreadId,
  pendingThreadId,
  threads,
  onSelectThread,
}) {
  const theme = useTheme();
  const surfaceSx = getStudioSurfaceSx(theme, accent, {
    darkTint: 0.08,
    lightTint: 0.06,
    shadowAlpha: 0.05,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        ...surfaceSx,
        p: 1.25,
        maxHeight: 'calc(100vh - 124px)',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1.25}>
        <Stack spacing={0.65} sx={{ px: 0.5, pt: 0.4 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HistoryRoundedIcon sx={{ color: alpha(accent, 0.9), fontSize: 18 }} />
            <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
              Recent chats
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: '0.8rem', color: theme.palette.mode === 'dark' ? '#9eb0c9' : '#5f6c82' }}>
            Stored only in this browser.
          </Typography>
        </Stack>

        <Box
          sx={{
            overflowY: 'auto',
            pr: 0.35,
            display: 'grid',
            gap: 1,
          }}
        >
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const isPending = thread.id === pendingThreadId;
            const meta = getRagThreadMeta(thread);

            return (
              <Paper
                key={thread.id}
                elevation={0}
                onClick={() => onSelectThread(thread.id)}
                sx={{
                  p: 1.2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: `1px solid ${
                    isActive
                      ? alpha(accent, 0.42)
                      : theme.palette.mode === 'dark'
                        ? alpha('#ffffff', 0.08)
                        : alpha(accent, 0.12)
                  }`,
                  background: isActive
                    ? theme.palette.mode === 'dark'
                      ? `linear-gradient(180deg, ${alpha(accent, 0.18)} 0%, rgba(23,31,45,0.96) 100%)`
                      : `linear-gradient(180deg, ${alpha(accent, 0.12)} 0%, rgba(255,255,255,0.98) 100%)`
                    : theme.palette.mode === 'dark'
                      ? 'rgba(14,20,30,0.92)'
                      : 'rgba(255,255,255,0.9)',
                  transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    borderColor: alpha(accent, 0.3),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 16px 28px ${alpha(accent, 0.09)}`,
                  },
                }}
              >
                <Stack spacing={0.9}>
                  <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: theme.palette.mode === 'dark' ? '#eef3fb' : '#132238',
                        minWidth: 0,
                      }}
                    >
                      {meta.title}
                    </Typography>
                    {isPending ? (
                      <Chip
                        label="Thinking"
                        size="small"
                        sx={{
                          height: 22,
                          fontWeight: 700,
                          color: accent,
                          backgroundColor: alpha(accent, 0.1),
                        }}
                      />
                    ) : null}
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      lineHeight: 1.45,
                      color: theme.palette.mode === 'dark' ? '#9eb0c9' : '#5f6c82',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {meta.preview}
                  </Typography>

                  <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '0.72rem', color: theme.palette.mode === 'dark' ? '#7f91ac' : '#77859b' }}>
                      {formatTimestamp(thread.updatedAt)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: theme.palette.mode === 'dark' ? '#7f91ac' : '#77859b' }}>
                      {meta.turnCount} messages
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
}
