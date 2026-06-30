import React from 'react';
import { Button, Paper, Stack, TextField, Typography, alpha, useTheme } from '@mui/material';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';

export default function StoredKeyField({
  accent,
  config,
  updateConfig,
  restoreStoredKey,
  fieldSx,
}) {
  const theme = useTheme();
  const showRateLimitHint =
    config.hasStoredKey && !config.customKeyMode && config.provider === 'OpenAI' && config.model === 'gpt-5-mini';

  return (
    <Stack spacing={1}>
      {config.hasStoredKey && !config.customKeyMode ? (
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1.2,
            borderRadius: 3.5,
            border: `1px solid ${alpha(accent, 0.12)}`,
            backgroundColor:
              theme.palette.mode === 'dark' ? alpha(accent, 0.08) : alpha(accent, 0.04),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <DoneRoundedIcon sx={{ color: alpha(accent, 0.9), fontSize: 18 }} />
            <Typography
              sx={{
                color: theme.palette.mode === 'dark' ? '#d3dded' : '#33425c',
                fontSize: '0.9rem',
              }}
            >
              Using stored API key
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={() => updateConfig({ apiKey: '', customKeyMode: true })}
            sx={{ textTransform: 'none', color: alpha(accent, 0.9), minWidth: 0 }}
          >
            Custom
          </Button>
        </Paper>
      ) : (
        <TextField
          label="API Key"
          size="small"
          type="password"
          value={config.apiKey}
          onChange={(event) => updateConfig({ apiKey: event.target.value, customKeyMode: true })}
          sx={fieldSx}
        />
      )}

      {showRateLimitHint ? (
        <Typography
          sx={{
            color: theme.palette.mode === 'dark' ? '#8ea0bc' : '#6c7c95',
            fontSize: '0.72rem',
            px: 0.25,
          }}
        >
          Rate limit: 2 requests/minute, 20/hour, 50/day.
        </Typography>
      ) : null}

      {config.hasStoredKey && config.customKeyMode ? (
        <Button
          size="small"
          onClick={restoreStoredKey}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', color: alpha(accent, 0.9) }}
        >
          Use stored key again
        </Button>
      ) : null}
    </Stack>
  );
}
