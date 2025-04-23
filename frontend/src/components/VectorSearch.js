import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, TextField, Button, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Table, TableHead, TableBody, TableRow, TableCell, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';

const EXAMPLE_SEQUENCE = `MTAIIKEIVSRNKRRYQEDGFDLDLTYIYPNIIAMGFPAERLEGVYRNNIDDVVRFLDSK
HKNHYKIYNLCAERHYDTAKFNCRVAQYPFEDHNPPQLELIKPFCEDLDQWLSEDDNHVA
AIHCKAGKGRTGVMICAYLLHRGKFLKAQEALDFYGEVRTRDKKGVTIPSQRRYVYYYSY
LLKNHLDYRPVALLFHKMMFETIPMFSGGTCNPQFVVCQLKVKIYSSNSGPTRREDKFMY
FEFPQPLPVCGDIKVEFFHKQNKMLKKDKMFHFWVNTFFIPGPEETSEKVENGSLCDQEI
DSICSIERADNDKEYLVLTLTKNDLDKANKDKANRYFSPNFKVKLYFTKTVEEPSNPEAS
SSTSVTPDVSDNEPDHYRYSDTTDSDPENEPFDEDQHTQITKV`;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

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
      const { data } = await axios.post(`${BACKEND_URL}/vector_search`, { sequence: seq });
      setEmbedTime(data.embedding_time);
      setSearchTime(data.search_time);
      setGoEnrichment(data.go_enrichment || []);
      setHits(data.found_embeddings || []);
    } catch (e) {
      setError(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && <Alert severity="warning" sx={{ mb:2 }}>{error}</Alert>}

      <Paper sx={{ p:2, mb:3 }}>
        <Typography variant="h6" gutterBottom>Vector Search</Typography>
        <Button variant="outlined" onClick={handleExample} sx={{ mb:2 }}>
          🔬 Load an example sequence
        </Button>
        <TextField
          label="Protein Sequence"
          placeholder="e.g., MKTFFVAGVLAALATA..."
          multiline
          rows={6}
          fullWidth
          value={sequence}
          onChange={e => setSequence(e.target.value)}
          sx={{ mb:2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </Paper>

      {embedTime != null && (
        <Box sx={{ mb:2 }}>
          <Typography>✅ Embedding time: {embedTime}s</Typography>
          <Typography>🔍 Search time: {searchTime}s</Typography>
        </Box>
      )}

      {goEnrichment.length === 0 && embedTime!=null && (
        <Alert severity="error">No similar proteins found.</Alert>
      )}

      {/* GO Enrichment */}
      {goEnrichment.length > 0 && (
        <>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => downloadCSV('go_enrichment.csv', goEnrichment)}
            sx={{ mb:2 }}
          >
            Download GO Enrichment CSV
          </Button>

          {Array.from(new Set(goEnrichment.map(g => g.Namespace))).map(ns => {
            const subset = goEnrichment.filter(g => g.Namespace === ns).slice(0, 10);
            return (
              <Accordion key={ns}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  Namespace: {ns} (top 10)
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(subset[0]).map(col => (
                          <TableCell key={col}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subset.map((row,i) => (
                        <TableRow key={i}>
                          {Object.keys(row).map(col => (
                            <TableCell key={col}>
                              {col === 'GO ID' 
                                ? <a href={`https://www.ebi.ac.uk/QuickGO/term/${row[col]}`} target="_blank" rel="noreferrer">{row[col]}</a>
                                : String(row[col]).split(', ').slice(0,5).join(', ') + (String(row[col]).split(', ').length>5?'…':'')
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </>
      )}

      {/* Hits */}
      {hits.length > 0 && (
        <>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => downloadCSV('similar_proteins.csv', hits)}
            sx={{ mt:2, mb:2 }}
          >
            Download Protein Hits CSV
          </Button>

          <Table size="small">
            <TableHead>
              <TableRow>
                {Object.keys(hits[0]).map(col => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hits.map((row,i) => (
                <TableRow key={i}>
                  {Object.entries(row).map(([col,val]) => (
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
        </>
      )}
    </Box>
  );
}
