import React, { useState } from 'react';
import { queryRAG, fetchRAGProteinInfo } from '../services/RAGService';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Paper, Alert, CircularProgress, Tooltip, Switch, Menu, alpha, Collapse,
  Divider, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlineIcon from '@mui/icons-material/LightbulbOutline';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';

const PROVIDER_MODELS = {
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  Google: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-pro-exp-02-05'],
  Anthropic: ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-20240620'],
  Nvidia: ['meta/llama-3.1-405b-instruct'],
  Mistral: ['mistral-small', 'codestral-latest'],
  OpenRouter: ['deepseek/deepseek-r1', 'deepseek/deepseek-r1:free'], 
};

const EXAMPLE_QUERIES = [
  "What proteins are related to Alzheimer's disease?",
  "What is the UniProt ID for insulin?",
  "List all proteins in Homo sapiens that are annotated with a GO term related to apoptosis.",
  "Retrieve proteins from rabbit proteome that are 200-500 amino acids long and contain transmembrane helixes.",
  "Retrieve all proteins in Homo sapiens with a known 3D structure"
];

const TEMPERATURE_RANGES = {
  OpenAI: { min: 0.0, max: 2.0, default: 1.0 },
  Google: { min: 0.0, max: 2.0, default: 1.0 },
  Anthropic: { min: 0.0, max: 1.0, default: 1.0 },
  Nvidia: { min: 0.0, max: 2.0, default: 1.0 },
  Mistral: { min: 0.0, max: 2.0, default: 0.7 },
  OpenRouter: { min: 0.0, max: 2.0, default: 1.0 },
};

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


export default function LLMQuery() {
  const [llmType, setLlmType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [topK, setTopK] = useState(10);
  const [sequence, setSequence] = useState('');
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState('');
  const [temperature, setTemperature] = useState(null);

  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [proteinInfo, setProteinInfo] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const filteredModels = provider ? PROVIDER_MODELS[provider] || [] : [];
  const [successMessage, setSuccessMessage] = useState('');
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
    setResults([]);
  
    if (!provider) return setWarning('Please select a provider.');
    if (!llmType) return setWarning('Please select an LLM type.');
    if (!apiKey) return setWarning('Please enter your API key.');
    if (!question.trim()) return setWarning('Please enter a question.');
  
    if (temperature !== null && temperature !== undefined) {
      const { min, max } = TEMPERATURE_RANGES[provider] || {};
      if (min !== undefined && max !== undefined) {
        if (temperature < min || temperature > max) {
          return setWarning(`Temperature must be between ${min} and ${max} for ${provider}.`);
        }
      }
    }
  
    setLoading(true);
    let attempt = 0;
    let success = false;
  
    try {
      while (attempt < 3 && !success) {
        attempt++;
  
        const { proteinIds } = await queryRAG({
          model: llmType,
          apiKey,
          question,
          sequence: sequence,
          topK: topK * 2,
          temperature
        });
  
        const validFormat = /^'(?:[A-Za-z0-9]+)'(?:,\s*'(?:[A-Za-z0-9]+)')*$/.test(proteinIds);
  
        if (validFormat) {
          const parsed = proteinIds.split(',').map(id => id.trim().replace(/^'|'$/g, ''));
          setResults(parsed);

          const detailedInfo = await fetchRAGProteinInfo(parsed);
          setProteinInfo(detailedInfo);

          setWarning('');
          setError('');
          setSuccessMessage(`Results are retrieved in attempt ${attempt}.`);
          success = true;
        } else {
          if (attempt < 3) {
            setWarning(`Results could not be retrieved. System tries again (attempt ${attempt}).`);
          }
        }
      }
  
      if (!success) {
        setWarning('');
        setError('System cannot produce a valid answer for this query in 3 tries.');
      }
  
    } catch (e) {
      setWarning('');
      setError(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 10, p: { xs: 2, md: 4 } }}>
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
                   LLM Query with RAG
        </Typography>

        {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          label="Question"
          fullWidth
          multiline
          minRows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What proteins are related to Alzheimer's disease?"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '1rem',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.subtle || theme.palette.background.paper, 0.3)
                  : alpha(theme.palette.background.subtle || theme.palette.grey[100], 0.3),
            }
          }}
        
        />

        <TextField
          label="Sequence"
          fullWidth
          multiline
          minRows={2}
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder="e.g., MKTFFVAGVLAALATA..."
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '1rem',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.subtle || theme.palette.background.paper, 0.3)
                  : alpha(theme.palette.background.subtle || theme.palette.grey[100], 0.3),
            }
          }}
        
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 2, flexWrap: 'nowrap', alignItems: 'center', width: '100%'}}>
            <FormControl sx={{ width: '50%', minWidth: '200px' }} variant="outlined" size="small">
              <InputLabel sx={{
                  '&.Mui-focused': {
                    color: '#904af7', 
                  },
                }}>Provider</InputLabel>
              <Select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setLlmType(''); // provider değişince model sıfırlansın
                }}
                label="Provider"
                sx={{
                  borderRadius: '16px', // 👈 kenar yumuşaklığı burada
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.3)
                      : alpha(theme.palette.grey[100], 0.5),
                  backdropFilter: 'blur(4px)', // ekstra şıklık için
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? alpha('#9351f5', 0.8) // koyu mor
                        : '#bf9af5', // açık tema için mor
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '16px',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.9)
                          : alpha(theme.palette.common.white, 0.9),
                      backdropFilter: 'blur(6px)',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(156, 39, 176, 0.3)' 
                          : '0 4px 20px rgba(156, 39, 176, 0.15)',
                    },
                  },
                }}
              >
                {Object.keys(PROVIDER_MODELS).map((prov) => (
                  <MenuItem key={prov} value={prov}>{prov}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ width: '50%', minWidth: '200px' }} variant="outlined" size="small" disabled={!provider}>
              <InputLabel sx={{
                  '&.Mui-focused': {
                    color: '#904af7', 
                  },
                }}>Model</InputLabel>
              <Select
                value={llmType}
                onChange={(e) => setLlmType(e.target.value)}
                label="Model"
                sx={{
                  borderRadius: '16px', // 👈 kenar yumuşaklığı burada
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.3)
                      : alpha(theme.palette.grey[100], 0.5),
                  backdropFilter: 'blur(4px)', // ekstra şıklık için
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? alpha('#9351f5', 0.8) // koyu mor
                        : '#bf9af5', // açık tema için mor
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '16px',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.9)
                          : alpha(theme.palette.common.white, 0.9),
                      backdropFilter: 'blur(6px)',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(156, 39, 176, 0.3)' 
                          : '0 4px 20px rgba(156, 39, 176, 0.15)',
                    },
                  },
                }}
              >
                {filteredModels.map((model) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="API Key"
            type="password"
            fullWidth
            size="small"
            sx={{
              borderRadius: '16px',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.3)
                  : alpha(theme.palette.grey[100], 0.5),
              backdropFilter: 'blur(4px)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              },
              '& label.Mui-focused': {
                color: '#904af7',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha('#9351f5', 0.8)
                    : '#bf9af5',
              },
            }}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </Box>

<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
          <Tooltip title="Example Questions">
            <Button
              startIcon={<LightbulbOutlineIcon />}
              onClick={handleMenuClick}
              sx={{
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                color: (theme) => theme.palette.text.secondary, // 👈 Gri görünüm
                fontWeight: 500,
                fontSize: '0.85rem',
                textTransform: 'none',
                px: 1.5,
                '&:hover': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.04)
                      : alpha(theme.palette.grey[500], 0.04),
                },
              }}
            >
              Example Questions
            </Button>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            MenuListProps={{
              dense: true, // menü elemanlarını biraz sıkılaştırmak için
            }}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.9)
                    : alpha(theme.palette.common.white, 0.9),
                backdropFilter: 'blur(6px)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 2px 6px rgba(0, 0, 0, 0.4)' // klasik soft dark gölge
                    : '0 2px 6px rgba(0, 0, 0, 0.1)',
                mt: 1,
              },
            }}
          >
            {EXAMPLE_QUERIES.map((example, i) => (
              <MenuItem
                key={i}
                onClick={() => handleExampleSelect(example)}
                sx={{
                  fontSize: '0.9rem',
                  py: 1.2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha('#9351f5', 0.1)
                        : alpha('#9351f5', 0.07),
                  },
                }}
              >
                {example}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Button
          onClick={() => setShowSettings(!showSettings)}
          startIcon={<TuneIcon />}
          variant="text"
          size="small"
          sx={{
            borderRadius: '12px',
            px: 1.5,
            py: 1,
            textTransform: 'none', // 👈 Tüm harfler küçük kalır
            fontWeight: 600,
            fontSize: '0.95rem',
            color: showSettings ? '#9351f5' : 'text.primary', // 👈 Açıldığında mor
            transition: 'color 0.3s ease',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#9351f5', // 👈 Üzerine gelince mor
            },
          }}
        >
          Configure Advanced Settings
        </Button>

        <Collapse in={showSettings} timeout="auto" unmountOnExit>
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 3,
              borderRadius: '16px',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.1)
                  : alpha(theme.palette.grey[100], 0.3),
            }}
          >

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Temperature"
                type="number"
                value={temperature ?? ''}
                inputProps={{
                  min: provider && llmType ? TEMPERATURE_RANGES[provider]?.min : undefined,
                  max: provider && llmType ? TEMPERATURE_RANGES[provider]?.max : undefined,
                  step: 0.1,
                  disabled: !provider || !llmType,
                  style: {
                    opacity: !provider || !llmType ? 0.5 : 1,
                    pointerEvents: !provider || !llmType ? 'none' : 'auto'
                  }
                }}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  const min = TEMPERATURE_RANGES[provider]?.min;
                  const max = TEMPERATURE_RANGES[provider]?.max;
                  if (!isNaN(value) && value >= min && value <= max) {
                    setTemperature(value);
                  }
                }}
                sx={{
                  width: 140,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.subtle || theme.palette.background.paper, 0.3)
                        : alpha(theme.palette.background.subtle || theme.palette.grey[100], 0.3),
                  },
                  '& label.Mui-focused': { color: '#904af7' },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) =>
                      theme.palette.mode === 'dark' ? alpha('#9351f5', 0.8) : '#bf9af5',
                  },
                }}
              />
              {llmType && (
                <Tooltip
                  title={`Range: ${TEMPERATURE_RANGES[provider].min} – ${TEMPERATURE_RANGES[provider].max}. Default: ${TEMPERATURE_RANGES[provider].default}`}
                  arrow
                >
                  <InfoOutlinedIcon sx={{ ml: 1, color: 'text.secondary', cursor: 'help' }} fontSize="small" />
                </Tooltip>
              )}
            </Box>  
                   

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Number of Embeddings"
                type="number"
                inputProps={{ min: 1, max: 100 }}
                value={topK}
                onChange={(e) => setTopK(+e.target.value)}
                sx={{
                  width: 100,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.subtle || theme.palette.background.paper, 0.3)
                        : alpha(theme.palette.background.subtle || theme.palette.grey[100], 0.3),
                  },
                  '& label.Mui-focused': {
                    color: '#904af7',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha('#9351f5', 0.8)
                        : '#bf9af5',
                  },
                }}
              />
              <Tooltip title="Limit represents the maximum number of proteins that will be returned as the output of the query." arrow>
                <InfoOutlinedIcon sx={{ ml: 1, color: 'text.secondary', cursor: 'help' }} fontSize="small" />
              </Tooltip>
            </Box>

          </Box>
          </Paper>
        </Collapse>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            borderRadius: '12px',
            minWidth: 160,
            fontWeight: 600,
            fontSize: '1rem',
            fontFamily: 'inherit',
            textTransform: 'none',
            backgroundColor: '#904af7', // 💜 mor ana rengi burada
            '&:hover': {
              backgroundColor: (theme) =>
                alpha('#904af7', theme.palette.mode === 'dark' ? 0.5 : 0.85), // hover için şeffaflık
            },
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
        </Box>
      </Paper>
      {proteinInfo.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Divider sx={{
            mb: 4,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'text.primary',
            textAlign: 'center',
            '&::before, &::after': {
              borderColor: theme => theme.palette.divider,
            },
          }}>
            Retrieved Proteins
          </Divider>

          <Button
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={() => downloadCSV('retrieved_proteins.csv', proteinInfo)}
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
            Download Protein Info CSV
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
          }}>
            <TableHead>
              <TableRow>
                {Object.keys(proteinInfo[0]).map(col => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {proteinInfo.map((row, i) => (
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
