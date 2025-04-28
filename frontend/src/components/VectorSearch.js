import React, { useState } from 'react';
import { vectorSearch } from '../services/VectorSearchService';
import {
  Box, TextField, Button, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Table, TableHead, TableBody, TableRow, TableCell, Alert, Divider, Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

const EXAMPLE_SEQUENCE = `MTAIIKEIVSRNKRRYQEDGFDLDLTYIYPNIIAMGFPAERLEGVYRNNIDDVVRFLDSK
HKNHYKIYNLCAERHYDTAKFNCRVAQYPFEDHNPPQLELIKPFCEDLDQWLSEDDNHVA
AIHCKAGKGRTGVMICAYLLHRGKFLKAQEALDFYGEVRTRDKKGVTIPSQRRYVYYYSY
LLKNHLDYRPVALLFHKMMFETIPMFSGGTCNPQFVVCQLKVKIYSSNSGPTRREDKFMY
FEFPQPLPVCGDIKVEFFHKQNKMLKKDKMFHFWVNTFFIPGPEETSEKVENGSLCDQEI
DSICSIERADNDKEYLVLTLTKNDLDKANKDKANRYFSPNFKVKLYFTKTVEEPSNPEAS
SSTSVTPDVSDNEPDHYRYSDTTDSDPENEPFDEDQHTQITKV`;

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function VectorSearch() {
  const [sequence, setSequence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [embedTime, setEmbedTime] = useState(null);
  const [searchTime, setSearchTime] = useState(null);
  const [goEnrichment, setGoEnrichment] = useState([]);
  const [hits, setHits] = useState([]);
  const mint = '#3698e3';

  const handleExample = () => setSequence(EXAMPLE_SEQUENCE);

  const handleSearch = async () => {
    setError(''); setEmbedTime(null);
    if (!sequence.trim()) return setError('Please enter a protein sequence.');
    let seq = sequence.trim();
    if (seq.startsWith('>')) {
      seq = seq.split('\n').filter(l => !l.startsWith('>')).join('');
    }
    setLoading(true);
    try {
      const {
              embedding_time,
              search_time,
              go_enrichment = [],
              found_embeddings = []
            } = await vectorSearch(seq);
        
            setEmbedTime(embedding_time);
            setSearchTime(search_time);
            setGoEnrichment(go_enrichment);
            setHits(found_embeddings);
    } catch (e) {
      setError(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 10, p: { xs: 2, md: 4 } }}>
      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={3} sx={{
              p: 4,
              mt: 4,
              borderRadius: 4,
              maxWidth: 1000,
              mx: 'auto',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(10px)',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 2px 16px rgba(0, 0, 0, 0.4)'
                  : '0 2px 12px rgba(0, 0, 0, 0.1)',}}
            >
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
           Vector-based Protein Search
        </Typography>

        <TextField
          placeholder="e.g., MKTFFVAGVLAALATA..."
          multiline
          minRows={6}
          fullWidth
          value={sequence}
          onChange={e => setSequence(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '1rem',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.subtle || theme.palette.background.paper, 0.3)
                  : alpha(theme.palette.background.subtle || theme.palette.grey[100], 0.3),
            },
          }}
        />

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          alignItems="center"
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            onClick={handleExample}
            sx={{
              borderRadius: '12px',
              minWidth: 160,
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'inherit',
              textTransform: 'none',
              color: mint,
              borderColor: mint,
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(mint, theme.palette.mode === 'dark' ? 0.2 : 0.08),
                borderColor: mint,
              },
            }}
          >
            Load Example Sequence
          </Button>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              minWidth: 160,
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'inherit',
              textTransform: 'none',
              backgroundColor: mint,
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(mint, theme.palette.mode === 'dark' ? 0.4 : 0.9),
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </Stack>
      </Paper>


      {embedTime != null && (
        <Box sx={{ mt: 4 }}>
          <Divider
            sx={{
              mb: 4, fontSize: '1.25rem', fontWeight: 600, color: 'text.primary',       
              textAlign: 'center',
              '&::before, &::after': {
                borderColor: theme => theme.palette.divider, 
              },
            }}
          >
             Performance
          </Divider>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            🧬 Embedding Time: <Box component="span" sx={{ fontWeight: 600 }}>{embedTime}s</Box>
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            🔎 Search Time: <Box component="span" sx={{ fontWeight: 600 }}>{searchTime}s</Box>
          </Typography>
        </Box>
      )}

      {embedTime != null && goEnrichment.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>No similar proteins found.</Alert>
      )}

      {/* GO Enrichment */}
      {goEnrichment.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Divider sx={{
              mb: 4, fontSize: '1.25rem', fontWeight: 600, color: 'text.primary',       
              textAlign: 'center',
              '&::before, &::after': {
                borderColor: theme => theme.palette.divider, 
              },
            }}
          >GO Enrichment</Divider>

          <Button
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={() => downloadCSV('go_enrichment.csv', goEnrichment)}
            variant="text"
            size="small"
            sx={{
              mb: 2,
              px: 2,
              py: 0.75,
              borderRadius: '16px',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              color: theme => theme.palette.text.secondary,
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Download GO Enrichment CSV
          </Button>

          {Array.from(new Set(goEnrichment.map(g => g.Namespace))).map(ns => {
            const subset = goEnrichment.filter(g => g.Namespace === ns).slice(0, 10);
            return (
              <Accordion
                key={ns}
                disableGutters
                elevation={0}
                square={false}
                sx={{
                  mb: 2, // aralık
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  '&:before': { display: 'none' }, // üst çizgiyi kaldır
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(255,255,255,0.05)'
                    : '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600} fontSize="1rem">
                    GO: {ns} <Typography component="span" color="text.secondary">(Selected enriched terms)</Typography>
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ overflowX: 'auto', px: 0 }}>
                  <Box
                    sx={{
                      minWidth: '850px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: theme => `1px solid ${theme.palette.divider}`,
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 4px 12px rgba(255,255,255,0.05)'
                        : '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: theme => theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100] }}>
                          {Object.keys(subset[0]).map(col => (
                            <TableCell
                              key={col}
                              sx={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                            >
                              {col}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {subset.map((row, i) => (
                          <TableRow
                            key={i}
                            hover
                            sx={{
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: theme => theme.palette.action.hover
                              }
                            }}
                          >
                            {Object.entries(row).map(([col, val]) => (
                              <TableCell key={col} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {col === 'GO ID' ? (
                                  <a
                                    href={`https://www.ebi.ac.uk/QuickGO/term/${val}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: '#1976d2',
                                      fontWeight: 500,
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    {val}
                                  </a>
                                ) : (
                                  String(val).split(', ').slice(0, 5).join(', ') + (String(val).split(', ').length > 5 ? '…' : '')
                                )}
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
        </Box>
      )}

      {/* Similar Proteins */}
      {hits.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Divider sx={{
              mb: 4, fontSize: '1.25rem', fontWeight: 600, color: 'text.primary',       
              textAlign: 'center',
              '&::before, &::after': {
                borderColor: theme => theme.palette.divider, 
              },
            }}
          > Similar Proteins</Divider>

          <Button
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={() => downloadCSV('similar_proteins.csv', hits)}
            variant="text"
            size="small"
            sx={{
              mb: 2,
              px: 2,
              py: 0.75,
              borderRadius: '16px',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              color: theme => theme.palette.text.secondary,
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Download Protein Hits CSV
          </Button>

          <Table size="small" sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? theme.palette.background.paper 
              : theme.palette.background.default,
            boxShadow: theme => theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : '0 4px 12px rgba(0,0,0,0.05)'
          }}
          >
            <TableHead>
              <TableRow>
                {Object.keys(hits[0]).map(col => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hits.map((row, i) => (
                <TableRow key={i}>
                  {Object.entries(row).map(([col, val]) => (
                    <TableCell key={col}>
                      {col === 'Protein ID'
                        ? <a href={`https://www.uniprot.org/uniprotkb/${val}`} target="_blank" rel="noreferrer">{val}</a>
                        : val
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
