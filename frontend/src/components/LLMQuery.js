import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormControlLabel, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const MODEL_CHOICES = [
  'deepseek/deepseek-r1', 'deepseek/deepseek-r1:free',
  'claude-3-7-sonnet-latest','claude-3-5-sonnet-20240620',
  'gemini-2.0-flash','gemini-1.5-flash',
  'gemini-2.0-flash-thinking-exp-01-21','gemini-2.0-pro-exp-02-05',
  'o3-mini','gpt-4o-mini','gpt-4o',
  'meta/llama-3.1-405b-instruct','mistral-small','codestral-latest'
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export default function LLMQuery() {
  const [llmType, setLlmType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [verbose, setVerbose] = useState(false);
  const [limit, setLimit] = useState(5);
  const [retryCount, setRetryCount] = useState(10);
  const [question, setQuestion] = useState('');

  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [solrQuery, setSolrQuery] = useState('');
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState(null);

  const handleSubmit = async () => {
    setWarning(''); setError('');
    if (!llmType)       return setWarning('Please select an LLM type.');
    if (!apiKey)        return setWarning('Please enter your API key.');
    if (!question.trim()) return setWarning('Please enter a question.');

    setLoading(true);
    try {
      const payload = { model: llmType, api_key: apiKey, verbose, limit, retry_count: retryCount, question };
      const { data } = await axios.post(`${BACKEND_URL}/llm_query`, payload);
      setSolrQuery(data.solr_query);
      setResults(data.results.results || []);
      setLogs(data.logs || null);
    } catch (e) {
      setError(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
      {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>LLM Query</Typography>
        <FormControl fullWidth sx={{ mb:2 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={llmType}
            label="Model"
            onChange={e => setLlmType(e.target.value)}
          >
            {MODEL_CHOICES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          label="API Key"
          type="password"
          fullWidth
          sx={{ mb:2 }}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={verbose}
              onChange={e => setVerbose(e.target.checked)}
            />
          }
          label="Verbose mode"
        />

        <Box sx={{ display:'flex', gap:2, mb:2 }}>
          <TextField
            label="Limit"
            type="number"
            inputProps={{ min:1, max:100 }}
            value={limit}
            onChange={e => setLimit(+e.target.value)}
          />
          <TextField
            label="Retry Count"
            type="number"
            inputProps={{ min:1 }}
            value={retryCount}
            onChange={e => setRetryCount(+e.target.value)}
          />
        </Box>

        <TextField
          label="Question"
          fullWidth
          placeholder="e.g., What proteins are related to Alzheimer's disease?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          sx={{ mb:2 }}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </Paper>

      {solrQuery && (
        <Paper sx={{ p:2, mb:2 }}>
          <Typography variant="subtitle1">Generated Solr Query</Typography>
          <Box component="pre" sx={{ whiteSpace:'pre-wrap' }}>{solrQuery}</Box>
        </Paper>
      )}

      {results.map((item, i) => (
        <Accordion key={i}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            {item.entryType}: {item.primaryAccession}
          </AccordionSummary>
          <AccordionDetails>
            <Typography><strong>Protein Name:</strong> {item.proteinDescription?.recommendedName?.fullName?.value || 'N/A'}</Typography>
            <Typography>
              <strong>UniProt Link:</strong>{' '}
              <a href={`https://www.uniprot.org/uniprotkb/${item.primaryAccession}`} target="_blank" rel="noreferrer">
                {item.primaryAccession}
              </a>
            </Typography>
            <Typography><strong>Gene:</strong> {item.genes?.[0]?.geneName?.value || 'N/A'}</Typography>
            <Typography><strong>Organism:</strong> {item.organism?.scientificName || 'N/A'}</Typography>
            <Typography><strong>Function:</strong> {item.comments?.[0]?.texts?.[0]?.value || 'N/A'}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      {verbose && logs && (
        <Paper sx={{ p:2, mt:2 }}>
          <Typography variant="subtitle1">Debug Logs</Typography>
          <Box component="pre">{logs}</Box>
        </Paper>
      )}
    </Box>
  );
}
