import React, { useState, useEffect } from 'react';
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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
} from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';

import DataTableCard from '../components/DataTableCard';
import ModuleFrame from '../components/ModuleFrame';
import { VECTOR_EXAMPLE_SEQUENCE } from '../constants';
import { downloadCsv } from '../utils/studioHelpers';
import { renderGoLink, renderProteinLink, summarizeTableValue } from '../utils/studioFormatters';
import { getStudioFieldSx, getStudioSurfaceSx } from '../utils/studioStyles';

const GO_COLUMN_MIN_WIDTHS = {
  'GO Name': 220,
  Namespace: 180,
  Definition: 320,
  'is A': 320,
};

function StatCard({ accent, label, value }) {
  const theme = useTheme();
  const surfaceSx = getStudioSurfaceSx(theme, accent, {
    darkTint: 0.06,
    lightTint: 0.04,
    darkBackground: 'rgba(18,24,28,0.96)',
    darkBackgroundEnd: 'rgba(12,16,19,0.99)',
    lightBackgroundEnd: 'rgba(248,250,249,0.96)',
    shadowAlpha: 0.07,
  });

  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: 2.4 }}>
      <Typography sx={{ color: theme.palette.mode === 'dark' ? '#9faeb2' : '#6a7579', fontSize: '0.9rem' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '1.7rem', color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
        {value}s
      </Typography>
    </Paper>
  );
}

export default function VectorStudioPanel({ meta, state }) {
  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Local threshold state, always synced with parent/global state
  const [similarityThreshold, setSimilarityThreshold] = useState(state.similarityThreshold ?? 0.8);

  // Sync local threshold with parent/global state when it changes externally
  useEffect(() => {
    if (state.similarityThreshold !== similarityThreshold) {
      setSimilarityThreshold(state.similarityThreshold ?? 0.8);
    }
  }, [state.similarityThreshold]);
  const theme = useTheme();
  const surfaceSx = getStudioSurfaceSx(theme, meta.accent, {
    darkTint: 0.06,
    lightTint: 0.04,
    darkBackground: 'rgba(18,24,28,0.96)',
    darkBackgroundEnd: 'rgba(12,16,19,0.99)',
    lightBackgroundEnd: 'rgba(248,250,249,0.96)',
    shadowAlpha: 0.07,
  });
  const fieldSx = getStudioFieldSx(theme, meta.accent, {
    radius: 4,
    alignTop: true,
    lightBackgroundAlpha: 0.96,
    darkBackgroundAlpha: 0.04,
  });

  return (
    <ModuleFrame meta={meta}>
      <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2.2, md: 2.75 } }}>
        <Stack spacing={2.25} alignItems="center">
          {state.error ? (
            <Alert severity="error" sx={{ width: '100%' }}>
              {state.error}
            </Alert>
          ) : null}

          <TextField
            multiline
            minRows={8}
            value={state.sequence}
            onChange={(event) => state.setSequence(event.target.value)}
            placeholder="Paste a protein sequence."
            sx={{ ...fieldSx, width: '100%' }}
            fullWidth
          />

          <Stack direction="row" spacing={1.25} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button
              startIcon={<TravelExploreRoundedIcon fontSize="small" />}
              onClick={() => state.setSequence(VECTOR_EXAMPLE_SEQUENCE)}
              sx={{ textTransform: 'none', color: alpha(meta.accent, 0.95) }}
            >
              Load example
            </Button>
            <Button
              startIcon={<TuneRoundedIcon fontSize="small" />}
              onClick={() => setShowAdvanced((prev) => !prev)}
              sx={{ textTransform: 'none', color: alpha(meta.accent, 0.92) }}
            >
              {showAdvanced ? 'Hide advanced' : 'Advanced settings'}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // If threshold changed, update parent and trigger search only after update
                if (state.setSimilarityThreshold && similarityThreshold !== state.similarityThreshold) {
                  state.setSimilarityThreshold(similarityThreshold);
                  // Use a microtask to ensure parent state is updated before search
                  Promise.resolve().then(() => state.search());
                } else {
                  state.search();
                }
              }}
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
              Search
            </Button>
          </Stack>

          <Collapse in={showAdvanced}>
            <Box sx={{ width: '100%', mt: 2 }}>
              <FormControl fullWidth size="small" variant="outlined" sx={fieldSx}>
                <InputLabel htmlFor="similarity-threshold">Similarity threshold</InputLabel>
                <OutlinedInput
                  id="similarity-threshold"
                  type="number"
                  label="Similarity threshold"
                  value={similarityThreshold}
                  inputProps={{ min: 0, max: 1, step: 0.01 }}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0.8;
                    if (val > 1) val = 1;
                    if (val < 0) val = 0;
                    setSimilarityThreshold(val);
                  }}
                  endAdornment={<InputAdornment position="end">[0-1]</InputAdornment>}
                />
              </FormControl>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                Only proteins with similarity above this threshold will be returned.
              </Typography>
            </Box>
          </Collapse>
        </Stack>
      </Paper>

      <Collapse in={state.hasResults} timeout={450} unmountOnExit>
        <Fade in={state.hasResults} timeout={550}>
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <StatCard accent={meta.accent} label="Embedding time" value={state.result.embeddingTime} />
              <StatCard accent={meta.accent} label="Search time" value={state.result.searchTime} />
            </Box>

            {state.result.goEnrichment.length === 0 ? (
              <Alert severity="info">No GO terms were found for this sequence.</Alert>
            ) : (
              <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.4 } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={1.5}
                  sx={{ mb: 2.25 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                      GO Enrichment
                    </Typography>
                    <Typography sx={{ color: theme.palette.mode === 'dark' ? '#9eb7b0' : '#5b6f67', mt: 0.4, fontSize: '0.9rem' }}>
                      Expand each namespace to inspect the selected enriched terms in table form.
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    startIcon={<DownloadRoundedIcon fontSize="small" />}
                    onClick={() => downloadCsv('go_enrichment.csv', state.result.goEnrichment)}
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
                </Stack>

                <Stack spacing={1.5}>
                  {state.goNamespaces.map((namespace) => {
                    const subset = state.result.goEnrichment
                      .filter((row) => row.Namespace === namespace)
                      .slice(0, 10);

                    if (!subset.length) {
                      return null;
                    }

                    return (
                      <Accordion
                        key={namespace}
                        disableGutters
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: `1px solid ${
                            theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(meta.accent, 0.12)
                          }`,
                          backgroundColor:
                            theme.palette.mode === 'dark' ? alpha(meta.accent, 0.06) : alpha(meta.accent, 0.035),
                          '&::before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                          <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
                            GO: {namespace}{' '}
                            <Typography component="span" sx={{ color: theme.palette.mode === 'dark' ? '#95aca4' : '#61756d', fontWeight: 500 }}>
                              (Selected enriched terms)
                            </Typography>
                          </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 0, pb: 0 }}>
                          <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 850 }}>
                              <TableHead>
                                <TableRow>
                                  {Object.keys(subset[0]).map((column) => (
                                    <TableCell
                                      key={`${namespace}-${column}`}
                                      sx={{
                                        fontWeight: 700,
                                        color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b',
                                        whiteSpace: 'nowrap',
                                        minWidth: GO_COLUMN_MIN_WIDTHS[column],
                                        borderBottomColor: alpha(
                                          theme.palette.divider,
                                          theme.palette.mode === 'dark' ? 0.55 : 0.9
                                        ),
                                      }}
                                    >
                                      {column}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {subset.map((row, rowIndex) => (
                                  <TableRow key={`${namespace}-${rowIndex}`} hover>
                                    {Object.entries(row).map(([column, value]) => (
                                      <TableCell
                                        key={`${namespace}-${rowIndex}-${column}`}
                                        sx={{
                                          color: theme.palette.mode === 'dark' ? '#dbe8e2' : '#33425c',
                                          verticalAlign: 'top',
                                          minWidth: GO_COLUMN_MIN_WIDTHS[column],
                                          borderBottomColor: alpha(
                                            theme.palette.divider,
                                            theme.palette.mode === 'dark' ? 0.4 : 0.75
                                          ),
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-word',
                                        }}
                                      >
                                        {column === 'GO ID' ? renderGoLink(value) : summarizeTableValue(value)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            {state.result.hits.length ? (
              <DataTableCard
                title="Similar Proteins"
                subtitle="Full similarity-hit table from the vector search stage."
                rows={state.result.hits}
                filename="similar_proteins.csv"
                pageSize={10}
                accent={meta.accent}
                cellRenderers={{ 'Protein ID': renderProteinLink }}
              />
            ) : null}
          </Stack>
        </Fade>
      </Collapse>
    </ModuleFrame>
  );
}
