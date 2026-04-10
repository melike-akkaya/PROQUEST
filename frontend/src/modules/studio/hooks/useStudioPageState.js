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
import {
  buildRagChatHistory,
  createRagThread,
  isRagThreadEmpty,
  limitRagThreads,
  loadPersistedRagThreads,
  normalizeRagThread,
  persistRagThreads,
} from '../utils/ragThreadStorage';

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
  const [ragThreadState, setRagThreadState] = useState(loadPersistedRagThreads);
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
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragSequence, setRagSequence] = useState('');
  const [ragError, setRagError] = useState('');
  const [ragPendingThreadId, setRagPendingThreadId] = useState(null);
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
  // Similarity threshold for vector search (default 0.9)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.9);
  const chatViewportRef = useRef(null);
  const ragRequestIdRef = useRef(0);
  const activeRagThreadIdRef = useRef(null);
  const ragThreads = ragThreadState.threads;
  const activeRagThreadId = ragThreadState.activeThreadId;

  const activeRagThread = useMemo(
    () => ragThreads.find((thread) => thread.id === activeRagThreadId) || ragThreads[0],
    [ragThreads, activeRagThreadId]
  );
  const ragMessages = useMemo(
    () => activeRagThread?.messages || [INITIAL_RAG_MESSAGE],
    [activeRagThread]
  );
  const ragLoading = ragPendingThreadId === activeRagThreadId;

  const activeModule = useMemo(() => {
    if (location.pathname.includes('/query/llm')) {
      return 'llm';
    }
    if (location.pathname.includes('/query/vector')) {
      return 'vector';
    }
    if (location.pathname.includes('/query/rag')) {
      return 'rag';
    }

    const params = new URLSearchParams(location.search);
    const moduleFromQuery = params.get('module');
    return ['llm', 'vector', 'rag'].includes(moduleFromQuery) ? moduleFromQuery : 'rag';
  }, [location.pathname, location.search]);

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

  const ragThreadList = useMemo(
    () =>
      [...ragThreads].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
    [ragThreads]
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
    activeRagThreadIdRef.current = activeRagThreadId;
  }, [activeRagThreadId]);

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
    persistRagThreads(ragThreads, activeRagThreadId);
  }, [ragThreads, activeRagThreadId]);

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

  function updateRagThread(threadId, updater) {
    setRagThreadState((current) => ({
      ...current,
      threads: current.threads.map((thread) => {
        if (thread.id !== threadId) {
          return thread;
        }

        return normalizeRagThread(updater(thread));
      }),
    }));
  }

  function selectRagThread(threadId) {
    setRagThreadState((current) => {
      const selectedThread = current.threads.find((thread) => thread.id === threadId);
      if (!selectedThread) {
        return current;
      }

      return {
        ...current,
        threads: [selectedThread, ...current.threads.filter((thread) => thread.id !== threadId)],
        activeThreadId: threadId,
      };
    });
    setRagError('');
    setRagQuestion('');
    setRagSequence('');
  }

  function updateRagConfig(updates) {
    setRagConfig((current) => ({ ...current, ...updates }));
  }

  function updateLlmConfig(updates) {
    setLlmConfig((current) => ({ ...current, ...updates }));
  }

  async function handleRagSend(prefilledQuestion) {
    const requestId = ++ragRequestIdRef.current;
    const threadId = activeRagThread?.id;
    const questionToSend = (prefilledQuestion ?? ragQuestion).trim();
    const sequenceToSend = ragSequence.trim();
    setRagError('');

    if (!threadId) {
      setRagError('Open a thread before sending a question.');
      return;
    }

    if (ragPendingThreadId) {
      setRagError('Wait for the current answer to finish before sending another message.');
      return;
    }

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
    };
    const nextMessages = [...ragMessages, userMessage];

    updateRagThread(threadId, (thread) => ({
      ...thread,
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
    }));
    setRagQuestion('');
    setRagSequence('');
    setRagPendingThreadId(threadId);

    try {
      const chatHistory = buildRagChatHistory(ragMessages);

      const ragResponse = await queryRAG({
        model: ragConfig.model,
        apiKey: ragConfig.apiKey,
        question: questionToSend,
        chatHistory,
        sequence: sequenceToSend,
        topK: ragConfig.topK,
        temperature: ragConfig.temperature,
      });

      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      let proteinInfo = [];
      if (ragResponse.proteinIds.length) {
        try {
          proteinInfo = await fetchRAGProteinInfo(ragResponse.proteinIds);
        } catch (_) {
          proteinInfo = [];
        }
      }

      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      updateRagThread(threadId, (thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        messages: [
          ...thread.messages,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: ragResponse.answer || 'No answer returned.',
            proteinIds: ragResponse.proteinIds,
            proteinInfo,
            tokenUsage: ragResponse.tokenUsage,
            suggestions: ragResponse.suggestedFollowUps?.length
              ? ragResponse.suggestedFollowUps
              : buildSuggestedFollowUps({
                  question: questionToSend,
                  answer: ragResponse.answer,
                  proteinInfo,
                  sequence: sequenceToSend,
                }),
          },
        ],
      }));
    } catch (error) {
      if (requestId !== ragRequestIdRef.current) {
        return;
      }

      if (activeRagThreadIdRef.current === threadId) {
        setRagError(formatApiError(error));
      }
      updateRagThread(threadId, (thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        messages: thread.messages.filter((message) => message.id !== userMessage.id),
      }));
      if (activeRagThreadIdRef.current === threadId) {
        setRagQuestion(questionToSend);
        setRagSequence(sequenceToSend);
      }
    } finally {
      if (requestId === ragRequestIdRef.current) {
        setRagPendingThreadId((current) => (current === threadId ? null : current));
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

  async function handleVectorSearch(nextThreshold = similarityThreshold) {
    setVectorError('');
    setVectorResult({ embeddingTime: null, searchTime: null, goEnrichment: [], hits: [] });

    const normalizedSequence = normalizeSequenceInput(vectorSequence);
    const thresholdToUse = Number.isFinite(nextThreshold) ? nextThreshold : similarityThreshold;
    if (!normalizedSequence) {
      setVectorError('Paste a protein sequence first.');
      return;
    }

    setVectorLoading(true);

    try {
      const response = await vectorSearch(normalizedSequence, thresholdToUse);
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
    if (isRagThreadEmpty(activeRagThread)) {
      setRagQuestion('');
      setRagSequence('');
      setRagError('');
      return;
    }

    const freshThread = createRagThread();
    setRagThreadState((current) => ({
      threads: limitRagThreads([freshThread, ...current.threads]),
      activeThreadId: freshThread.id,
    }));
    setRagQuestion('');
    setRagSequence('');
    setRagError('');
  }

  function clearRagThreads() {
    const freshThread = createRagThread();
    setRagThreadState({
      threads: [freshThread],
      activeThreadId: freshThread.id,
    });
    setRagQuestion('');
    setRagSequence('');
    setRagError('');
  }

  return {
    activeModule,
    activeModuleMeta,
    shellStyles,
    rag: {
      config: ragConfig,
      messages: ragMessages,
      threads: ragThreadList,
      activeThreadId: activeRagThreadId,
      pendingThreadId: ragPendingThreadId,
      question: ragQuestion,
      sequence: ragSequence,
      error: ragError,
      loading: ragLoading,
      busy: Boolean(ragPendingThreadId),
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
      selectThread: selectRagThread,
      send: handleRagSend,
      resetThread: resetRagThread,
      clearThreads: clearRagThreads,
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
      similarityThreshold,
      setSimilarityThreshold,
    },
  };
}
