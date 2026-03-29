import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Fade,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import ModuleFrame from '../components/ModuleFrame';
import StoredKeyField from '../components/StoredKeyField';
import { LLM_EXAMPLES, PROVIDER_MODELS, TEMPERATURE_RANGES } from '../constants';
import { downloadCsv } from '../utils/studioHelpers';
import { buildLlmExportRows, renderProteinLink } from '../utils/studioFormatters';
import { getStudioFieldSx, getStudioMenuPaperSx, getStudioSurfaceSx } from '../utils/studioStyles';

export default function LlmStudioPanel({ meta, state }) {
  const theme = useTheme();
  const surfaceSx = getStudioSurfaceSx(theme, meta.accent);
  const fieldSx = getStudioFieldSx(theme, meta.accent);
  const temperatureRange = TEMPERATURE_RANGES[state.config.provider];

  return (
    <>
      <ModuleFrame meta={meta}>
        <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2.2, md: 2.75 } }}>
          <Stack spacing={2.2}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
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
            </Box>

            <StoredKeyField
              accent={meta.accent}
              config={state.config}
              updateConfig={state.updateConfig}
              restoreStoredKey={state.restoreStoredKey}
              fieldSx={fieldSx}
            />

            {state.error ? <Alert severity="error">{state.error}</Alert> : null}

            <TextField
              label="Question"
              multiline
              minRows={5}
              value={state.question}
              onChange={(event) => state.setQuestion(event.target.value)}
              placeholder="Describe the protein search in natural language."
              sx={fieldSx}
              fullWidth
            />

            <Stack
              direction="row"
              spacing={1.25}
              flexWrap="wrap"
              useFlexGap
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  startIcon={<LightbulbOutlinedIcon fontSize="small" />}
                  onClick={(event) => state.setExamplesAnchor(event.currentTarget)}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.92) }}
                >
                  Example questions
                </Button>
                <Button
                  startIcon={<TuneRoundedIcon fontSize="small" />}
                  onClick={() => state.setShowAdvanced((current) => !current)}
                  sx={{ textTransform: 'none', color: alpha(meta.accent, 0.92) }}
                >
                  {state.showAdvanced ? 'Hide advanced' : 'Advanced settings'}
                </Button>
              </Stack>

              <Button
                variant="contained"
                onClick={state.submit}
                disabled={state.loading}
                endIcon={state.loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
                sx={{
                  borderRadius: '999px',
                  px: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${meta.accent} 0%, ${alpha(meta.accent, 0.85)} 100%)`,
                  boxShadow: `0 16px 30px ${alpha(meta.accent, 0.18)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${meta.accent} 0%, ${alpha(meta.accent, 0.85)} 100%)`,
                    boxShadow: `0 18px 34px ${alpha(meta.accent, 0.22)}`,
                  },
                }}
              >
                {state.loading ? 'Searching...' : 'Search'}
              </Button>
            </Stack>

            <Collapse in={state.showAdvanced}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 220px))' },
                  gap: 2,
                  pt: 0.5,
                }}
              >
                <TextField
                  label={`Temperature (${temperatureRange?.min ?? 0} - ${temperatureRange?.max ?? 2})`}
                  size="small"
                  type="number"
                  value={state.config.temperature}
                  inputProps={{
                    min: temperatureRange?.min ?? 0,
                    max: temperatureRange?.max ?? 2,
                    step: 0.1,
                  }}
                  onChange={(event) => state.updateConfig({ temperature: Number(event.target.value) })}
                  sx={fieldSx}
                />
                <TextField
                  label="Result limit"
                  size="small"
                  type="number"
                  value={state.config.limit}
                  inputProps={{ min: 1, max: 100 }}
                  onChange={(event) => state.updateConfig({ limit: Number(event.target.value) })}
                  sx={fieldSx}
                />
                <TextField
                  label="Retry count"
                  size="small"
                  type="number"
                  value={state.config.retryCount}
                  inputProps={{ min: 1 }}
                  onChange={(event) => state.updateConfig({ retryCount: Number(event.target.value) })}
                  sx={fieldSx}
                />
              </Box>
            </Collapse>

            <FormControlLabel
              control={
                <Switch
                  checked={state.config.verbose}
                  onChange={(event) => state.updateConfig({ verbose: event.target.checked })}
                />
              }
              label="Verbose logs"
            />
          </Stack>
        </Paper>

        <Collapse in={state.hasSearched} timeout={450} unmountOnExit>
          <Fade in={state.hasSearched} timeout={550}>
            <Stack spacing={3}>
              {state.loading ? (
                <LinearProgress
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: alpha(meta.accent, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${alpha(meta.accent, 0.42)} 0%, ${meta.accent} 100%)`,
                    },
                  }}
                />
              ) : null}

              {state.result.solrQuery ? (
                <Paper elevation={0} sx={{ ...surfaceSx, p: 2.4 }}>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b', mb: 1 }}>
                    Generated Solr Query
                  </Typography>
                  <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c', m: 0 }}>
                    {state.result.solrQuery}
                  </Typography>
                </Paper>
              ) : null}

              <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.4 } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={1.5}
                  sx={{ mb: state.result.results.length ? 2.25 : 0 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                      UniProt Results
                    </Typography>
                    <Typography sx={{ color: theme.palette.mode === 'dark' ? '#9fb2cd' : '#5b6f90', mt: 0.4, fontSize: '0.9rem' }}>
                      Original expandable result list restored for the LLM query flow.
                    </Typography>
                  </Box>

                  {state.result.results.length ? (
                    <Button
                      size="small"
                      startIcon={<DownloadRoundedIcon fontSize="small" />}
                      onClick={() => downloadCsv('llm_query_results.csv', buildLlmExportRows(state.result.results))}
                      sx={{
                        borderRadius: '999px',
                        textTransform: 'none',
                        color: meta.accent,
                        backgroundColor: alpha(meta.accent, 0.08),
                        '&:hover': {
                          backgroundColor: alpha(meta.accent, 0.14),
                        },
                      }}
                    >
                      Export CSV
                    </Button>
                  ) : null}
                </Stack>

                {!state.loading && !state.result.results.length ? (
                  <Alert severity="info">No proteins were returned for this query.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {state.result.results.map((item, index) => (
                      <Accordion
                        key={`${item.primaryAccession || 'result'}-${index}`}
                        disableGutters
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: `1px solid ${
                            theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(meta.accent, 0.12)
                          }`,
                          backgroundColor:
                            theme.palette.mode === 'dark' ? alpha(meta.accent, 0.05) : alpha(meta.accent, 0.03),
                          '&::before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                          <Typography sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                            UniProtKB-SwissProt (reviewed) protein: {item.primaryAccession || 'N/A'}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1}>
                            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c' }}>
                              <strong>Protein Name:</strong> {item.proteinDescription?.recommendedName?.fullName?.value || 'N/A'}
                            </Typography>
                            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c' }}>
                              <strong>UniProt Link:</strong>{' '}
                              {item.primaryAccession ? renderProteinLink(item.primaryAccession) : 'N/A'}
                            </Typography>
                            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c' }}>
                              <strong>Gene:</strong> {item.genes?.[0]?.geneName?.value || 'N/A'}
                            </Typography>
                            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c' }}>
                              <strong>Organism:</strong> {item.organism?.scientificName || 'N/A'}
                            </Typography>
                            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c' }}>
                              <strong>Function:</strong> {item.comments?.[0]?.texts?.[0]?.value || 'N/A'}
                            </Typography>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                )}
              </Paper>

              {state.config.verbose && state.result.logs ? (
                <Paper elevation={0} sx={{ ...surfaceSx, p: 2.4 }}>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b', mb: 1 }}>
                    Debug Logs
                  </Typography>
                  <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c', m: 0 }}>
                    {state.result.logs}
                  </Typography>
                </Paper>
              ) : null}
            </Stack>
          </Fade>
        </Collapse>
      </ModuleFrame>

      <Menu
        anchorEl={state.examplesAnchor}
        open={Boolean(state.examplesAnchor)}
        onClose={() => state.setExamplesAnchor(null)}
        PaperProps={{ sx: getStudioMenuPaperSx(theme) }}
      >
        {LLM_EXAMPLES.map((example) => (
          <MenuItem
            key={example}
            onClick={() => {
              state.setQuestion(example);
              state.setExamplesAnchor(null);
            }}
            sx={{ whiteSpace: 'normal', fontSize: '0.92rem', lineHeight: 1.45 }}
          >
            {example}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
