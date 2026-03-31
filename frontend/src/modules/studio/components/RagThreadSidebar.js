import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import { getRagThreadMeta, isRagThreadEmpty } from '../utils/ragThreadStorage';
import { getStudioSurfaceSx } from '../utils/studioStyles';

export default function RagThreadSidebar({
  accent,
  activeThreadId,
  busy = false,
  pendingThreadId,
  threads,
  onCreateThread,
  onClearThreads,
  onSelectThread,
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const surfaceSx = getStudioSurfaceSx(theme, accent, {
    darkTint: 0.08,
    lightTint: 0.06,
    shadowAlpha: 0.05,
  });
  const width = expanded ? 250 : 58;
  const canClearThreads = !busy && threads.some((thread) => !isRagThreadEmpty(thread));

  function handleClearThreads() {
    if (!canClearThreads) {
      return;
    }

    if (window.confirm('Clear saved chats from this browser?')) {
      onClearThreads?.();
    }
  }

  return (
    <Box
      sx={{
        width,
        ml: 'auto',
        transition: 'width 180ms ease',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          ...surfaceSx,
          p: expanded ? 1.25 : 0.7,
          maxHeight: 'calc(100vh - 124px)',
          overflow: 'hidden',
        }}
      >
        {expanded ? (
          <Stack spacing={1.1}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <HistoryRoundedIcon sx={{ color: alpha(accent, 0.9), fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                  Chats
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.35} alignItems="center">
                <IconButton
                  size="small"
                  onClick={handleClearThreads}
                  disabled={!canClearThreads}
                  sx={{ color: theme.palette.mode === 'dark' ? '#9eb0c9' : '#526178' }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setExpanded(false)}
                  sx={{ color: theme.palette.mode === 'dark' ? '#9eb0c9' : '#526178' }}
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Button
              fullWidth
              startIcon={<AddRoundedIcon fontSize="small" />}
              onClick={onCreateThread}
              sx={{
                justifyContent: 'flex-start',
                px: 1.25,
                py: 0.9,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#eef3fb' : '#132238',
                backgroundColor: theme.palette.mode === 'dark' ? alpha(accent, 0.12) : alpha(accent, 0.08),
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(accent, 0.18) : alpha(accent, 0.12),
                },
              }}
            >
              New thread
            </Button>

            <Box
              sx={{
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 0.25,
                display: 'grid',
                gap: 0.75,
              }}
            >
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const isPending = thread.id === pendingThreadId;
                const meta = getRagThreadMeta(thread);

                return (
                  <Box
                    key={thread.id}
                    onClick={() => onSelectThread(thread.id)}
                    sx={{
                      width: '100%',
                      px: 1.1,
                      py: 0.95,
                      borderRadius: 3,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      border: `1px solid ${
                        isActive
                          ? alpha(accent, 0.42)
                          : theme.palette.mode === 'dark'
                            ? alpha('#ffffff', 0.08)
                            : alpha(accent, 0.12)
                      }`,
                      backgroundColor: isActive
                        ? theme.palette.mode === 'dark'
                          ? alpha(accent, 0.16)
                          : alpha(accent, 0.1)
                        : theme.palette.mode === 'dark'
                          ? 'rgba(14,20,30,0.88)'
                          : 'rgba(255,255,255,0.9)',
                      transition: 'border-color 160ms ease, background-color 160ms ease',
                      '&:hover': {
                        borderColor: alpha(accent, 0.3),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '8px minmax(0, 1fr)',
                        alignItems: 'center',
                        columnGap: 1,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          backgroundColor: isPending
                            ? accent
                            : isActive
                              ? alpha(accent, 0.75)
                              : theme.palette.mode === 'dark'
                                ? alpha('#ffffff', 0.18)
                                : alpha('#132238', 0.18),
                        }}
                      />
                      <Typography
                        sx={{
                          display: 'block',
                          width: '100%',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.83rem',
                          color: theme.palette.mode === 'dark' ? '#eef3fb' : '#132238',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.title}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Stack>
        ) : (
          <Stack spacing={0.85} alignItems="center">
            <IconButton
              onClick={() => setExpanded(true)}
              sx={{
                width: 40,
                height: 40,
                color: theme.palette.mode === 'dark' ? '#eef3fb' : '#132238',
                backgroundColor: theme.palette.mode === 'dark' ? alpha(accent, 0.14) : alpha(accent, 0.08),
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(accent, 0.2) : alpha(accent, 0.12),
                },
              }}
            >
              <HistoryRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={onCreateThread}
              sx={{
                width: 40,
                height: 40,
                color: accent,
                border: `1px solid ${alpha(accent, 0.22)}`,
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
