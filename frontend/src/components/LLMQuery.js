import React, { useState } from 'react';
import { queryLLM } from '../services/LLMService';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Alert, CircularProgress, Tooltip, Switch, Menu, alpha, Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlineIcon from '@mui/icons-material/LightbulbOutline';
import TuneIcon from '@mui/icons-material/Tune';
import { useEffect } from 'react';
import axios from 'axios';
import { Checkbox } from '@mui/material';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';


const PROVIDER_MODELS = {
  OpenAI: [
    'gpt-4o',
    'gpt-4o-mini',
    'o3-mini',
    'gpt-4.1-2025-04-14',
    'o4-mini-2025-04-16',
    'o3-2025-04-16',
    'o3-mini-2025-01-31',
    'o1-2024-12-17',
    'o1-mini-2024-09-12',
    'o1-pro-2025-03-19',
    'gpt-3.5-turbo-instruct',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0125',
    'gpt-4-0125-preview',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4-1106-preview',
    'gpt-4-32k-0613',
    'gpt-4-0613',
    'gpt-3.5-turbo-16k'
  ],
  Google: [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
  ],
  Anthropic: [
    'claude-3-7-sonnet-latest',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-latest',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ],
  Nvidia: [
    'meta/llama-3.1-405b-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'nv-mistralai/mistral-nemo-12b-instruct',
    'mistralai/mixtral-8x22b-instruct-v0.1',
    'mistralai/mistral-large-2-instruct',
    'nvidia/nemotron-4-340b-instruct'
  ],
  Mistral: [
    'mistral-small',
    'codestral-latest'
  ],
  OpenRouter: [
    'deepseek/deepseek-r1',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1-distill-llama-70b',
    'deepseek/deepseek-r1:nitro',
    'deepseek/deepseek-chat'
  ]
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

export default function LLMQuery() {
  const [llmType, setLlmType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [verbose, setVerbose] = useState(false);
  const [limit, setLimit] = useState(5);
  const [retryCount, setRetryCount] = useState(10);
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState('');
  const [temperature, setTemperature] = useState(null);

  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [solrQuery, setSolrQuery] = useState('');
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const filteredModels = provider ? PROVIDER_MODELS[provider] || [] : [];

  
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [customKeyMode, setCustomKeyMode] = useState(false);
  useEffect(() => {
    if (provider) {
      axios.get('/available_api_keys')
        .then(res => {
          const keys = res.data;
          const matchedKey = keys[provider];
  
          if (matchedKey) {
            setApiKey(matchedKey);
            setHasStoredKey(true);
            setCustomKeyMode(false);
          } else {
            setApiKey('');
            setHasStoredKey(false);
            setCustomKeyMode(true);
          }
        })
        .catch(() => {
          setApiKey('');
          setHasStoredKey(false);
          setCustomKeyMode(true);
        });
    }
  }, [provider]);

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
    try {
      const { solr_query, results, logs } = await queryLLM({
              model: llmType,
              apiKey,
              verbose,
              limit,
              retryCount,
              question,
              temperature: temperature ?? undefined
            });
            setSolrQuery(solr_query);
            setResults(results);
            setLogs(logs);
    } catch (e) {
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
                   LLM Query
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
                          fontSize: '1rem',
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
                                ? alpha('#904af7', 0.8)
                                : '#904af7',
                          },
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

          {hasStoredKey ? (
            <Box sx={{ width: '100%' }}>
              <Box
                sx={{
                  px: 2,
                  minHeight: 40,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.grey[500], 0.3)
                      : theme.palette.grey[400],
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.3)
                      : alpha(theme.palette.grey[100], 0.5),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(4px)',
                  fontSize: '0.95rem',
                  mb: customKeyMode ? 1.5 : 0 // custom aktifse kutuyla arasına boşluk
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DoneOutlinedIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                  <Typography variant="body2">
                    Using API key from <code>.env</code> file
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={customKeyMode}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCustomKeyMode(checked);
                        if (checked) {
                          setApiKey('');
                        } else {
                          axios.get('/available_api_keys').then(res => {
                            const matchedKey = res.data[provider];
                            if (matchedKey) {
                              setApiKey(matchedKey);
                            }
                          });
                        }
                      }}
                    />
                  }
                  label="Use custom"
                  sx={{ m: 0, mr: 1 }}
                />
              </Box>

              {customKeyMode && (
                <TextField
                  type="password"
                  placeholder="Enter your API key"
                  size="small"
                  fullWidth
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
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
                />
              )}
            </Box>
          ) : (
            <TextField
              label="API Key"
              type="password"
              fullWidth
              size="small"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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
            />
          )}

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
            <FormControlLabel
              control={
                <Switch
                  checked={verbose}
                  onChange={(e) => setVerbose(e.target.checked)}
                  color="secondary"
                />
              }
              label="Verbose Mode"
            />

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
                label="Limit"
                type="number"
                inputProps={{ min: 1, max: 100 }}
                value={limit}
                onChange={(e) => setLimit(+e.target.value)}
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

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Retry Count"
                type="number"
                inputProps={{ min: 1 }}
                value={retryCount}
                onChange={(e) => setRetryCount(+e.target.value)}
                sx={{
                  width: 120,
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
              <Tooltip title="LLMs can produce inconsistent answers. If a valid query is not generated, the system re-submits the same request until either a correct query is produced or the retry limit is reached. Increasing the retry count lengthens response time; although it does not guarantee a correct result, it improves the likelihood of obtaining one." arrow>
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
            <Accordion 
              key={i}
              disableGutters
              elevation={0}
              square={false}
              sx={{
                mb: 2,
                borderRadius: '16px',
                border: theme => `1px solid ${theme.palette.divider}`,
                backgroundColor: theme => theme.palette.background.paper,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme => theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(255, 255, 255, 0.08)'
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                },
                '&::before': {
                  display: 'none',
                }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>
                  UniProtKB-SwissProt (reviewed) protein: {item.primaryAccession}
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
    </Box>
  );
}
