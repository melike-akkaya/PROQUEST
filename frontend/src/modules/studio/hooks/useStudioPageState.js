import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

import { queryLLM } from '../../../services/LLMService';
import { queryRAG, fetchRAGProteinInfo } from '../../../services/RAGService';
import { vectorSearch } from '../../../services/VectorSearchService';
import {
  INITIAL_RAG_MESSAGE,
  PROVIDER_MODELS,
  STUDIO_MODULES,
  TEMPERATURE_RANGES,
} from '../constants';
import {
  buildSuggestedFollowUps,
  formatApiError,
  normalizeSequenceInput,
} from '../utils/studioHelpers';

function createModelConfig(provider = 'OpenAI') {
  return {
    provider,
    model: PROVIDER_MODELS[provider]?.[0] || '',
    apiKey: '',
    hasStoredKey: false,
    customKeyMode: false,
    temperature: TEMPERATURE_RANGES[provider]?.default ?? 1.0,
  };
}

async function getStoredProviderKey(provider) {
  if (!provider) {
    return { apiKey: '', hasStoredKey: false, customKeyMode: true };
  }

  try {
    const response = await axios.get('/available_api_keys');
    const matchedKey = response.data?.[provider];

    if (matchedKey) {
      return {
        apiKey: matchedKey,
        hasStoredKey: true,
        customKeyMode: false,
      };
    }
  } catch (_) {
    // Fall back to manual entry mode.
  }

  return {
    apiKey: '',
    hasStoredKey: false,
    customKeyMode: true,
  };
}

function validateTemperature(provider, temperature) {
  const bounds = TEMPERATURE_RANGES[provider];
  if (!bounds) {
    return true;
  }

  return temperature >= bounds.min && temperature <= bounds.max;
}

function getShellBackground(activeModule, paletteMode) {
  if (activeModule === 'rag') {
    return paletteMode === 'dark'
      ? 'radial-gradient(circle at top left, rgba(109, 140, 255, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(153, 131, 255, 0.1), transparent 30%), linear-gradient(180deg, #0d1420 0%, #121925 100%)'
      : 'radial-gradient(circle at top left, rgba(113, 143, 255, 0.1), transparent 30%), radial-gradient(circle at top right, rgba(161, 145, 255, 0.08), transparent 32%), linear-gradient(180deg, #f7f9fd 0%, #eef2f8 100%)';
  }

  if (activeModule === 'llm') {
    return paletteMode === 'dark'
      ? 'radial-gradient(circle at top left, rgba(47, 140, 255, 0.2), transparent 26%), radial-gradient(circle at top right, rgba(66, 181, 255, 0.14), transparent 30%), linear-gradient(180deg, #0b1422 0%, #0f1b2d 100%)'
      : 'radial-gradient(circle at top left, rgba(47, 140, 255, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(99, 191, 255, 0.1), transparent 32%), linear-gradient(180deg, #f5f9ff 0%, #eaf3ff 100%)';
  }

  if (activeModule === 'vector') {
    return paletteMode === 'dark'
      ? 'radial-gradient(circle at top left, rgba(79, 138, 118, 0.12), transparent 26%), radial-gradient(circle at top right, rgba(120, 153, 143, 0.1), transparent 30%), linear-gradient(180deg, #0d1416 0%, #141c1f 100%)'
      : 'radial-gradient(circle at top left, rgba(79, 138, 118, 0.08), transparent 28%), radial-gradient(circle at top right, rgba(148, 166, 161, 0.08), transparent 32%), linear-gradient(180deg, #f7f9f8 0%, #eef2f1 100%)';
  }

  return paletteMode === 'dark'
    ? 'radial-gradient(circle at top left, rgba(255, 122, 89, 0.18), transparent 26%), radial-gradient(circle at top right, rgba(86, 119, 255, 0.18), transparent 32%), linear-gradient(180deg, #0d1420 0%, #121a27 100%)'
    : 'radial-gradient(circle at top left, rgba(255, 122, 89, 0.14), transparent 28%), radial-gradient(circle at top right, rgba(86, 119, 255, 0.14), transparent 34%), linear-gradient(180deg, #f6f8fc 0%, #edf2f9 100%)';
}

export default function useStudioPageState() {
  const theme = useTheme();
  const location = useLocation();
  const [ragConfig, setRagConfig] = useState(() => ({
    ...createModelConfig('OpenAI'),
    topK: 10,
  }));
  const [llmConfig, setLlmConfig] = useState(() => ({
    ...createModelConfig('OpenAI'),
    verbose: false,
    limit: 5,
    retryCount: 10,
  }));
  const [ragMessages, setRagMessages] = useState([INITIAL_RAG_MESSAGE]);
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragSequence, setRagSequence] = useState('');
  const [ragError, setRagError] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [showRagAdvanced, setShowRagAdvanced] = useState(false);
  const [ragExamplesAnchor, setRagExamplesAnchor] = useState(null);
  const [llmQuestion, setLlmQuestion] = useState('');
  const [llmError, setLlmError] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmHasSearched, setLlmHasSearched] = useState(false);
  const [llmShowAdvanced, setLlmShowAdvanced] = useState(false);
  const [llmExamplesAnchor, setLlmExamplesAnchor] = useState(null);
  const [llmResult, setLlmResult] = useState({ solrQuery: '', results: [], logs: null });
  const [vectorSequence, setVectorSequence] = useState('');
  const [vectorError, setVectorError] = useState('');
  const [vectorLoading, setVectorLoading] = useState(false);
  const [vectorResult, setVectorResult] = useState({
    embeddingTime: null,
    searchTime: null,
    goEnrichment: [],
    hits: [],
  });
  const chatViewportRef = useRef(null);
  const ragRequestIdRef = useRef(0);

  const activeModule = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const moduleFromQuery = params.get('module');
    return ['llm', 'vector', 'rag'].includes(moduleFromQuery) ? moduleFromQuery : 'rag';
  }, [location.search]);

  const activeModuleMeta = useMemo(
    () => STUDIO_MODULES.find((module) => module.id === activeModule) || STUDIO_MODULES[0],
    [activeModule]
  );

  const latestRagInsight = useMemo(
    () =>
      [...ragMessages]
        .reverse()
        .find((message) => message.role === 'assistant' && (message.proteinInfo?.length || message.proteinIds?.length)),
    [ragMessages]
  );

  const vectorGoNamespaces = useMemo(
    () =>
      Array.from(new Set(vectorResult.goEnrichment.map((row) => row.Namespace).filter(Boolean))),
    [vectorResult.goEnrichment]
  );

  const shellStyles = useMemo(
    () => ({
      background: getShellBackground(activeModule, theme.palette.mode),
      minHeight: 'calc(100vh - 160px)',
    }),
    [activeModule, theme.palette.mode]
  );

  useEffect(() => {
    if (!chatViewportRef.current) {
      return;
    }

    chatViewportRef.current.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [ragMessages, ragLoading]);

  useEffect(() => {
    let cancelled = false;

    getStoredProviderKey(ragConfig.provider).then((updates) => {
      if (!cancelled) {
        setRagConfig((current) => ({ ...current, ...updates }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ragConfig.provider]);

  useEffect(() => {
    let cancelled = false;

    getStoredProviderKey(llmConfig.provider).then((updates) => {
      if (!cancelled) {
        setLlmConfig((current) => ({ ...current, ...updates }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [llmConfig.provider]);

  async function restoreStoredKey(provider, applyUpdates) {
    const updates = await getStoredProviderKey(provider);
    applyUpdates((current) => ({ ...current, ...updates }));
  }

  function updateRagConfig(updates) {
    setRagConfig((current) => ({ ...current, ...updates }));
  }

  function updateLlmConfig(updates) {
    setLlmConfig((current) => ({ ...current, ...updates }));
  }

  async function handleRagSend(prefilledQuestion) {
    const requestId = ++ragRequestIdRef.current;
    const questionToSend = (prefilledQuestion ?? ragQuestion).trim();
    const sequenceToSend = ragSequence.trim();
    setRagError('');

    if (!ragConfig.provider || !ragConfig.model) {
      setRagError('Choose a provider and model for the RAG thread.');
      return;
    }

    if (!ragConfig.apiKey) {
      setRagError('Enter an API key or use the stored provider key.');
      return;
    }

    if (!questionToSend) {
      setRagError('Write a question to continue the conversation.');
      return;
    }

    if (!validateTemperature(ragConfig.provider, ragConfig.temperature)) {
      const range = TEMPERATURE_RANGES[ragConfig.provider];
      setRagError(`Temperature must stay between ${range.min} and ${range.max}.`);
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: questionToSend,
      sequence: sequenceToSend,
      includeInContext: true,
    };
    const nextMessages = [...ragMessages, userMessage];

    setRagMessages(nextMessages);
    setRagQuestion('');
    setRagSequence('');
    setRagLoading(true);

    try {
      const ragResponse = await queryRAG({
        model: ragConfig.model,
        apiKey: ragConfig.apiKey,
        question: questionToSend,
        chatHistory: ragMessages
          .filter((message) => message.id !== 'rag-welcome')
          .filter((message) => message.includeInContext !== false)
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .slice(-6)
          .map((message) => ({
            role: message.role,
            content: message.content,
            includeInContext: true,
          })),
        sequence: sequenceToSend,
        topK: ragConfig.topK,
        temperature: ragConfig.temperature,
      });

      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      const proteinInfo = ragResponse.proteinIds.length
        ? await fetchRAGProteinInfo(ragResponse.proteinIds)
        : [];

      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      setRagMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: ragResponse.answer || 'No answer returned.',
          proteinIds: ragResponse.proteinIds,
          proteinInfo,
          suggestions: ragResponse.suggestedFollowUps?.length
            ? ragResponse.suggestedFollowUps
            : buildSuggestedFollowUps({
                question: questionToSend,
                answer: ragResponse.answer,
                proteinInfo,
                sequence: sequenceToSend,
              }),
        },
      ]);
    } catch (error) {
      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      setRagError(formatApiError(error));
      setRagMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setRagQuestion(questionToSend);
      setRagSequence(sequenceToSend);
    } finally {
      if (requestId === ragRequestIdRef.current) {
        setRagLoading(false);
      }
    }
  }

  async function handleLlmSubmit() {
    setLlmError('');
    setLlmResult({ solrQuery: '', results: [], logs: null });

    if (!llmQuestion.trim()) {
      setLlmError('Write a protein search request first.');
      return;
    }

    if (!llmConfig.apiKey) {
      setLlmError('Enter an API key or use the stored provider key.');
      return;
    }

    if (!validateTemperature(llmConfig.provider, llmConfig.temperature)) {
      const range = TEMPERATURE_RANGES[llmConfig.provider];
      setLlmError(`Temperature must stay between ${range.min} and ${range.max}.`);
      return;
    }

    setLlmHasSearched(true);
    setLlmLoading(true);

    try {
      const response = await queryLLM({
        model: llmConfig.model,
        apiKey: llmConfig.apiKey,
        verbose: llmConfig.verbose,
        limit: llmConfig.limit,
        retryCount: llmConfig.retryCount,
        question: llmQuestion.trim(),
        temperature: llmConfig.temperature,
      });

      setLlmResult({
        solrQuery: response.solr_query,
        results: response.results,
        logs: response.logs,
      });
    } catch (error) {
      setLlmError(formatApiError(error));
    } finally {
      setLlmLoading(false);
    }
  }

  async function handleVectorSearch() {
    setVectorError('');
    setVectorResult({ embeddingTime: null, searchTime: null, goEnrichment: [], hits: [] });

    const normalizedSequence = normalizeSequenceInput(vectorSequence);
    if (!normalizedSequence) {
      setVectorError('Paste a protein sequence first.');
      return;
    }

    setVectorLoading(true);

    try {
      const response = await vectorSearch(normalizedSequence);
      setVectorResult({
        embeddingTime: response.embedding_time,
        searchTime: response.search_time,
        goEnrichment: response.go_enrichment || [],
        hits: response.found_embeddings || [],
      });
    } catch (error) {
      setVectorError(formatApiError(error));
    } finally {
      setVectorLoading(false);
    }
  }

  function resetRagThread() {
    ragRequestIdRef.current += 1;
    setRagMessages([INITIAL_RAG_MESSAGE]);
    setRagQuestion('');
    setRagSequence('');
    setRagError('');
    setRagLoading(false);
  }

  return {
    activeModule,
    activeModuleMeta,
    shellStyles,
    rag: {
      config: ragConfig,
      messages: ragMessages,
      question: ragQuestion,
      sequence: ragSequence,
      error: ragError,
      loading: ragLoading,
      showAdvanced: showRagAdvanced,
      examplesAnchor: ragExamplesAnchor,
      latestInsight: latestRagInsight,
      chatViewportRef,
      setQuestion: setRagQuestion,
      setSequence: setRagSequence,
      setShowAdvanced: setShowRagAdvanced,
      setExamplesAnchor: setRagExamplesAnchor,
      updateConfig: updateRagConfig,
      restoreStoredKey: () => restoreStoredKey(ragConfig.provider, setRagConfig),
      send: handleRagSend,
      resetThread: resetRagThread,
    },
    llm: {
      config: llmConfig,
      question: llmQuestion,
      error: llmError,
      loading: llmLoading,
      hasSearched: llmHasSearched,
      showAdvanced: llmShowAdvanced,
      examplesAnchor: llmExamplesAnchor,
      result: llmResult,
      setQuestion: setLlmQuestion,
      setShowAdvanced: setLlmShowAdvanced,
      setExamplesAnchor: setLlmExamplesAnchor,
      updateConfig: updateLlmConfig,
      restoreStoredKey: () => restoreStoredKey(llmConfig.provider, setLlmConfig),
      submit: handleLlmSubmit,
    },
    vector: {
      sequence: vectorSequence,
      error: vectorError,
      loading: vectorLoading,
      result: vectorResult,
      goNamespaces: vectorGoNamespaces,
      hasResults: vectorResult.embeddingTime !== null,
      setSequence: setVectorSequence,
      search: handleVectorSearch,
    },
  };
}
