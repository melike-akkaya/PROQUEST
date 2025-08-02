import React, { useState, useEffect } from 'react';
import TypewriterEffect from './TypewriterEffect';
import { queryRAG, fetchRAGProteinInfo } from '../services/RAGService';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Paper, Alert, CircularProgress, Tooltip, Checkbox, Menu, alpha, Collapse,
  Divider, Table, TableHead, TableBody, TableRow, TableCell, FormControlLabel
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlineIcon from '@mui/icons-material/LightbulbOutline';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
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
  "What is the catalytic activity, cofactor requirement and pathway context of human CYP2E1?",
  "What is the function of human albumin?",
  "What information is there on variant dbSNP rs63750001 in human Presenilin-1?",
  "Find genes that are causally connected to xeroderma pigmentosum",
  "Retrieve multidrug antibiotic resistance-related proteins in reference proteome for Klebsiella pneumoniae"
];

const EXAMPLE_CASE = {
  question: "What does the Amyloid-beta precursor protein do in the brain, and what proteins does it interact with?",
  sequence: `MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG
EFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFR
GVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEE
EADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPC
RAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARD
PVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQA
KNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITAL
QAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYER
MNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTET
KTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTN
IKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITL
VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN`
};

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

  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [customKeyMode, setCustomKeyMode] = useState(false);
  const [answer, setAnswer] = useState('');

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


  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [proteinInfo, setProteinInfo] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const filteredModels = provider ? PROVIDER_MODELS[provider] || [] : [];
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
    setAnswer('');
    setResults([]);
    setProteinInfo([]);
  
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
      const { answer: llmAnswer, proteinIds } = await queryRAG({
        model:       llmType,
        apiKey,
        question,
        sequence,
        topK: topK,
        temperature
      });

      setAnswer(llmAnswer);

      setResults(proteinIds);

      const detailed = await fetchRAGProteinInfo(proteinIds);
      setProteinInfo(detailed);
    } catch (e) {
      setError(e.response?.data || e.message || 'Unknown error');
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
                  color: '#16a5a5',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha('#16a5a5', 0.8)
                      : '#16a5a5',
                },
              }}
        
        />

        <TextField
          label="Sequence (Optional)"
          fullWidth
          multiline
          minRows={2}
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder="e.g., MKTFFVAGVLAALATA..."
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
                  color: '#16a5a5',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha('#16a5a5', 0.8)
                      : '#16a5a5',
                },
              }}
        
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 2, flexWrap: 'nowrap', alignItems: 'center', width: '100%'}}>
            <FormControl sx={{ width: '50%', minWidth: '200px' }} variant="outlined" size="small">
              <InputLabel sx={{
                  '&.Mui-focused': {
                    color: '#16a5a5', 
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
                        ? alpha('#16a5a5', 0.8) // koyu mor
                        : '#16a5a5', // açık tema için mor
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
                          ? '0 4px 20px rgba(39, 176, 165, 0.3)' 
                          : '0 4px 20px rgba(39, 176, 149, 0.15)',
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
                    color: '#16a5a5', 
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
                        ? alpha('#16a5a5', 0.8) // koyu mor
                        : '#16a5a5', // açık tema için mor
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
                          ? '0 4px 20px rgba(39, 176, 151, 0.3)' 
                          : '0 4px 20px rgba(39, 176, 133, 0.15)',
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
                      color: '#16a5a5',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha('#16a5a5', 0.8)
                          : '#16a5a5',
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
                  color: '#16a5a5',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha('#16a5a5', 0.8)
                      : '#16a5a5',
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
                        ? alpha('#16a5a5', 0.1)
                        : alpha('#16a5a5', 0.07),
                  },
                }}
              >
                {example}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 1 }}>
          {/* Sol: Ayarları aç/kapat */}
          <Button
            onClick={() => setShowSettings(!showSettings)}
            startIcon={<TuneIcon />}
            variant="text"
            size="small"
            sx={{
              borderRadius: '12px',
              px: 1.5,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: showSettings ? '#16a5a5' : 'text.primary',
              transition: 'color 0.3s ease',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#16a5a5',
              },
            }}
          >
            Configure Advanced Settings
          </Button>

          {/* Sağ: Örnek yükle */}
          <Button
            variant="outlined"
            onClick={() => {
              setQuestion(EXAMPLE_CASE.question);
              setSequence(EXAMPLE_CASE.sequence);
            }}
            sx={{
              borderRadius: '12px',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.9rem',
              color: '#16a5a5',
              borderColor: '#16a5a5',
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha('#16a5a5', theme.palette.mode === 'dark' ? 0.2 : 0.05),
                borderColor: '#16a5a5',
              },
            }}
          >
            Load Example Case
          </Button>
        </Box>


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
                  '& label.Mui-focused': { color: '#03d8c3' },
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
            backgroundColor: '#03d8c3', // 💜 mor ana rengi burada
            '&:hover': {
              backgroundColor: (theme) =>
                alpha('#03d8c3', theme.palette.mode === 'dark' ? 0.5 : 0.85), // hover için şeffaflık
            },
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
        </Box>

        {/* ── NEW: Show the LLM’s answer in a read‐only textbox ──────────────────── */}

      </Paper>
      {answer && (
        <Box sx={{ mt: 5 }}>
          <Divider
            sx={{
              mb: 4,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'text.primary',
              textAlign: 'center',
              '&::before, &::after': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          >
            Model Output
          </Divider>

          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.03)',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem',
              color: 'text.primary',
              lineHeight: 1.6,
              position: 'relative',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              minHeight: 80
            }}
          >
            <TypewriterEffect text={answer} speed={15} />
          </Box>
        </Box>
      )}
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
