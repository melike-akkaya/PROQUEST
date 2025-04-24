import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Alert, CircularProgress, Tooltip, Switch, Menu, alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlineIcon from '@mui/icons-material/LightbulbOutline';

const MODEL_CHOICES = [
  'deepseek/deepseek-r1', 'deepseek/deepseek-r1:free',
  'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-20240620',
  'gemini-2.0-flash', 'gemini-1.5-flash',
  'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-pro-exp-02-05',
  'o3-mini', 'gpt-4o-mini', 'gpt-4o',
  'meta/llama-3.1-405b-instruct', 'mistral-small', 'codestral-latest'
];

const EXAMPLE_QUERIES = [
  "What proteins are related to Alzheimer's disease?",
  "What is the function of protein P53?",
  "What is the structure of human hemoglobin?",
  "List all proteins involved in glycolysis.",
  "What is the UniProt ID for insulin?",
  "Retrieve all proteins in Homo sapiens with a known 3D structure."
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

  // For dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleExampleSelect = (example) => {
    setQuestion(example);
    handleMenuClose();
  };

  const handleSubmit = async () => {
    setWarning('');
    setError('');

    if (!llmType) return setWarning('Please select an LLM type.');
    if (!apiKey) return setWarning('Please enter your API key.');
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
    <Paper elevation={3} sx={{ borderRadius: '16px', p: 3, bgcolor: theme => alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(8px)' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        LLM Query
      </Typography>

      {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl sx={{ flex: '1 1 300px', minWidth: 250 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={llmType}
            label="Model"
            onChange={e => setLlmType(e.target.value)}
          >
            {MODEL_CHOICES.map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="API Key"
          type="password"
          sx={{ flex: '1 1 300px', minWidth: 250 }}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Tooltip title="Example Questions">
          <Button
            variant="outlined"
            startIcon={<LightbulbOutlineIcon />}
            onClick={handleMenuClick}
            sx={{ borderRadius: '12px', whiteSpace: 'nowrap' }}
          >
            Example Questions
          </Button>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
        >
          {EXAMPLE_QUERIES.map((example, i) => (
            <MenuItem key={i} onClick={() => handleExampleSelect(example)}>
              {example}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <TextField
        label="Question"
        fullWidth
        multiline
        minRows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g., What proteins are related to Alzheimer's disease?"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <Tooltip title="Show detailed debug information">
          <FormControlLabel
            control={<Switch checked={verbose} onChange={e => setVerbose(e.target.checked)} color="primary" />}
            label="Verbose Mode"
          />
        </Tooltip>

        <TextField
          label="Limit"
          type="number"
          inputProps={{ min: 1, max: 100 }}
          value={limit}
          onChange={e => setLimit(+e.target.value)}
          sx={{ width: 100 }}
        />

        <TextField
          label="Retry Count"
          type="number"
          inputProps={{ min: 1 }}
          value={retryCount}
          onChange={e => setRetryCount(+e.target.value)}
          sx={{ width: 120 }}
        />
      </Box>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        sx={{ borderRadius: '12px', py: 1.2 }}
      >
        {loading ? 'Searching…' : 'Search'}
      </Button>

      {solrQuery && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: '12px', bgcolor: theme => alpha(theme.palette.background.default, 0.8) }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Generated Solr Query
          </Typography>
          <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 1 }}>
            {solrQuery}
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        {results.map((item, i) => (
          <Accordion key={i} sx={{ borderRadius: '12px', overflow: 'hidden', mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 500 }}>
                {item.entryType}: {item.primaryAccession}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography><strong>Protein Name:</strong> {item.proteinDescription?.recommendedName?.fullName?.value || 'N/A'}</Typography>
              <Typography><strong>UniProt Link:</strong>{' '}
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
      </Box>

      {verbose && logs && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: '12px', bgcolor: theme => alpha(theme.palette.background.default, 0.8) }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon fontSize="small" /> Debug Logs
          </Typography>
          <Box component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
            {logs}
          </Box>
        </Paper>
      )}
    </Paper>
  );
}
