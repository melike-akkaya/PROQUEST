import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Fade,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import ChatBubble from '../components/ChatBubble';
import DataTableCard from '../components/DataTableCard';
import ModuleFrame from '../components/ModuleFrame';
import StoredKeyField from '../components/StoredKeyField';
import { PROVIDER_MODELS, RAG_EXAMPLES, TEMPERATURE_RANGES } from '../constants';
import { renderProteinLink } from '../utils/studioFormatters';
import { getStudioFieldSx, getStudioMenuPaperSx, getStudioSurfaceSx } from '../utils/studioStyles';

export default function RagStudioPanel({ meta, state }) {
  const theme = useTheme();
  const hasUserTurns = state.messages.some((message) => message.role === 'user');
  const visibleMessages = hasUserTurns
    ? state.messages.filter((message) => message.id !== 'rag-welcome')
    : state.messages;
  const surfaceSx = getStudioSurfaceSx(theme, meta.accent, {
    darkTint: 0.08,
    lightTint: 0.07,
    shadowAlpha: 0.06,
  });
  const fieldSx = getStudioFieldSx(theme, meta.accent);

  return (
    <>
      <ModuleFrame meta={meta} showMobileIntro={!hasUserTurns}>
        <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 1.75, md: 2.1 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', lg: 'center' }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TuneRoundedIcon sx={{ color: alpha(meta.accent, 0.9), fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                  Settings
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  startIcon={<TuneRoundedIcon fontSize="small" />}
                  onClick={() => state.setShowAdvanced((current) => !current)}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.9) }}
                >
                  {state.showAdvanced ? 'Hide advanced' : 'Show advanced'}
                </Button>
                <Button
                  startIcon={<RestartAltRoundedIcon fontSize="small" />}
                  onClick={state.resetThread}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.9) }}
                >
                  New thread
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1.15fr' },
                gap: 2,
              }}
            >
              <FormControl size="small" fullWidth sx={fieldSx}>
                <InputLabel>Provider</InputLabel>
                <Select
                  label="Provider"
                  value={state.config.provider}
                  onChange={(event) =>
                    state.updateConfig({
                      provider: event.target.value,
                      model: PROVIDER_MODELS[event.target.value]?.[0] || '',
                      temperature: TEMPERATURE_RANGES[event.target.value]?.default ?? 1.0,
                    })
                  }
                >
                  {Object.keys(PROVIDER_MODELS).map((provider) => (
                    <MenuItem key={provider} value={provider}>
                      {provider}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth sx={fieldSx}>
                <InputLabel>Model</InputLabel>
                <Select
                  label="Model"
                  value={state.config.model}
                  onChange={(event) => state.updateConfig({ model: event.target.value })}
                >
                  {(PROVIDER_MODELS[state.config.provider] || []).map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <StoredKeyField
                accent={meta.accent}
                config={state.config}
                updateConfig={state.updateConfig}
                restoreStoredKey={state.restoreStoredKey}
                fieldSx={fieldSx}
              />
            </Box>

            <Collapse in={state.showAdvanced}>
              <Box
                sx={{
                  pt: 0.5,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '220px 220px' },
                  gap: 2,
                }}
              >
                <TextField
                  label={`Temperature (${TEMPERATURE_RANGES[state.config.provider]?.min ?? 0} - ${
                    TEMPERATURE_RANGES[state.config.provider]?.max ?? 2
                  })`}
                  size="small"
                  type="number"
                  value={state.config.temperature}
                  inputProps={{
                    min: TEMPERATURE_RANGES[state.config.provider]?.min ?? 0,
                    max: TEMPERATURE_RANGES[state.config.provider]?.max ?? 2,
                    step: 0.1,
                  }}
                  onChange={(event) => state.updateConfig({ temperature: Number(event.target.value) })}
                  sx={fieldSx}
                />
                <TextField
                  label="Retrieved proteins (top K)"
                  size="small"
                  type="number"
                  value={state.config.topK}
                  inputProps={{ min: 1, max: 100 }}
                  onChange={(event) => state.updateConfig({ topK: Number(event.target.value) })}
                  sx={fieldSx}
                />
              </Box>
            </Collapse>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 1.25, md: 1.75 } }}>
          {state.error ? <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert> : null}

          <Box
            ref={state.chatViewportRef}
            sx={{
              maxHeight: { xs: 420, md: 540 },
              overflowY: 'auto',
              overflowX: 'hidden',
              px: { xs: 0.35, md: 0.75 },
              pr: { xs: 1, md: 1.25 },
              pb: 0.5,
              scrollBehavior: 'smooth',
              scrollPaddingBottom: 12,
            }}
          >
            <Stack spacing={2}>
              {visibleMessages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  accent={meta.accent}
                  onSuggestionClick={state.send}
                />
              ))}

              {state.loading ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    border: `1px solid ${alpha(meta.accent, 0.14)}`,
                    backgroundColor: alpha(meta.accent, 0.05),
                  }}
                >
                  <CircularProgress size={20} sx={{ color: alpha(meta.accent, 0.9) }} />
                  <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d3dded' : '#33425c' }}>
                    Retrieving proteins and preparing the next answer...
                  </Typography>
                </Paper>
              ) : null}
            </Stack>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={2}>
            <TextField
              label="Question"
              multiline
              minRows={2}
              maxRows={6}
              value={state.question}
              onChange={(event) => state.setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  state.send();
                }
              }}
              placeholder="Ask a follow-up or start a new protein question."
              sx={fieldSx}
            />
            <TextField
              label="Optional sequence"
              multiline
              minRows={2}
              maxRows={6}
              value={state.sequence}
              onChange={(event) => state.setSequence(event.target.value)}
              placeholder="Add sequence only if this turn needs it."
              sx={fieldSx}
            />

            <Stack
              direction="row"
              spacing={1.25}
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  startIcon={<LightbulbOutlinedIcon fontSize="small" />}
                  onClick={(event) => state.setExamplesAnchor(event.currentTarget)}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.9) }}
                >
                  Example questions
                </Button>
                <Button
                  size="small"
                  startIcon={<TravelExploreRoundedIcon fontSize="small" />}
                  onClick={() => {
                    state.setQuestion(RAG_EXAMPLES.case.question);
                    state.setSequence(RAG_EXAMPLES.case.sequence);
                  }}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.9) }}
                >
                  Load example case
                </Button>
              </Stack>

              <IconButton
                onClick={() => state.send()}
                disabled={state.loading}
                sx={{
                  width: 48,
                  height: 48,
                  background: `linear-gradient(135deg, ${meta.accent} 0%, ${alpha(meta.accent, 0.82)} 100%)`,
                  color: '#fff',
                  boxShadow: `0 14px 26px ${alpha(meta.accent, 0.18)}`,
                  '&:hover': {
                    boxShadow: `0 16px 30px ${alpha(meta.accent, 0.22)}`,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha(meta.accent, 0.32),
                    color: '#fff',
                  },
                }}
              >
                {state.loading ? <CircularProgress size={20} color="inherit" /> : <ArrowUpwardRoundedIcon />}
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        <Collapse in={Boolean(state.latestInsight?.proteinInfo?.length)} timeout={450} unmountOnExit>
          <Fade in={Boolean(state.latestInsight?.proteinInfo?.length)} timeout={550}>
            <Box>
              <Box sx={{ mb: state.loading ? 1.25 : 0 }}>
                {state.loading ? (
                  <LinearProgress
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: alpha(meta.accent, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${alpha(meta.accent, 0.4)} 0%, ${meta.accent} 100%)`,
                      },
                    }}
                  />
                ) : null}
              </Box>
              <DataTableCard
                title="Retrieved proteins"
                rows={state.latestInsight?.proteinInfo || []}
                filename="rag_protein_info.csv"
                accent={meta.accent}
                cellRenderers={{ 'Protein ID': renderProteinLink }}
              />
            </Box>
          </Fade>
        </Collapse>
      </ModuleFrame>

      <Menu
        anchorEl={state.examplesAnchor}
        open={Boolean(state.examplesAnchor)}
        onClose={() => state.setExamplesAnchor(null)}
        PaperProps={{ sx: getStudioMenuPaperSx(theme) }}
      >
        {RAG_EXAMPLES.prompts.map((prompt) => (
          <MenuItem
            key={prompt}
            onClick={() => {
              state.setQuestion(prompt);
              state.setExamplesAnchor(null);
            }}
            sx={{ whiteSpace: 'normal', fontSize: '0.92rem', lineHeight: 1.45 }}
          >
            {prompt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
