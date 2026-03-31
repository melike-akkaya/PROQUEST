import { INITIAL_RAG_MESSAGE } from '../constants';

const STORAGE_KEY = 'uniprot-llm:rag-threads:v1';
const MAX_STORED_THREADS = 24;
const MAX_REQUEST_USER_TURNS = 3;

function cloneWelcomeMessage() {
  return {
    ...INITIAL_RAG_MESSAGE,
    suggestions: [...(INITIAL_RAG_MESSAGE.suggestions || [])],
  };
}

function createThreadId() {
  return `rag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function trimText(value, maxLength) {
  const normalized = (value || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function normalizeIsoDate(value, fallback) {
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return fallback;
  }

  return candidate.toISOString();
}

function normalizeMessage(message, index) {
  const content = (message?.content || '').toString();
  const role = message?.role === 'user' ? 'user' : 'assistant';

  return {
    id: message?.id || `${role}-${index}-${Date.now()}`,
    role,
    content,
    sequence: typeof message?.sequence === 'string' ? message.sequence : '',
    proteinIds: Array.isArray(message?.proteinIds) ? message.proteinIds.filter(Boolean) : [],
    proteinInfo: Array.isArray(message?.proteinInfo) ? message.proteinInfo : [],
    suggestions: Array.isArray(message?.suggestions) ? message.suggestions.filter(Boolean).slice(0, 4) : [],
  };
}

function serializeMessageForStorage(message, index) {
  const normalized = normalizeMessage(message, index);

  return {
    id: normalized.id,
    role: normalized.role,
    content: normalized.content,
    sequence: normalized.sequence,
    suggestions: normalized.suggestions,
  };
}

function isContextMessage(message) {
  return (
    message?.id !== INITIAL_RAG_MESSAGE.id &&
    (message?.role === 'user' || message?.role === 'assistant') &&
    typeof message?.content === 'string' &&
    message.content.trim()
  );
}

function buildThreadTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim());
  return trimText(firstUserMessage?.content, 58) || 'New protein thread';
}

function buildThreadPreview(messages) {
  const latestVisibleMessage = [...messages]
    .reverse()
    .find((message) => (message.role === 'user' || message.role === 'assistant') && message.content.trim());

  return (
    trimText(latestVisibleMessage?.content, 84) ||
      'Continue a protein conversation from this browser.'
  );
}

export function getRagThreadMeta(thread) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [cloneWelcomeMessage()];
  const turnCount = messages.filter(
    (message) =>
      (message.role === 'user' || message.role === 'assistant') &&
      message.id !== INITIAL_RAG_MESSAGE.id
  ).length;

  return {
    title: buildThreadTitle(messages),
    preview: buildThreadPreview(messages),
    turnCount,
  };
}

export function normalizeRagThread(thread) {
  const now = new Date().toISOString();
  const createdAt = normalizeIsoDate(thread?.createdAt, now);
  const updatedAt = normalizeIsoDate(thread?.updatedAt, createdAt);
  const rawMessages = Array.isArray(thread?.messages) && thread.messages.length
    ? thread.messages
    : [cloneWelcomeMessage()];
  const messages = rawMessages.map(normalizeMessage);

  return {
    id: thread?.id || createThreadId(),
    createdAt,
    updatedAt,
    messages,
  };
}

export function limitRagThreads(threads) {
  return (Array.isArray(threads) ? threads : []).slice(0, MAX_STORED_THREADS);
}

export function createRagThread(overrides = {}) {
  const now = new Date().toISOString();
  return normalizeRagThread({
    id: createThreadId(),
    createdAt: now,
    updatedAt: now,
    messages: [cloneWelcomeMessage()],
    ...overrides,
  });
}

export function loadPersistedRagThreads() {
  const fallbackThread = createRagThread();

  if (typeof window === 'undefined') {
    return {
      activeThreadId: fallbackThread.id,
      threads: [fallbackThread],
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        activeThreadId: fallbackThread.id,
        threads: [fallbackThread],
      };
    }

    const parsed = JSON.parse(raw);
    const threads = Array.isArray(parsed?.threads) && parsed.threads.length
      ? limitRagThreads(parsed.threads.map(normalizeRagThread))
      : [fallbackThread];

    const activeThreadId = threads.some((thread) => thread.id === parsed?.activeThreadId)
      ? parsed.activeThreadId
      : threads[0].id;

    return { activeThreadId, threads };
  } catch (_) {
    return {
      activeThreadId: fallbackThread.id,
      threads: [fallbackThread],
    };
  }
}

export function persistRagThreads(threads, activeThreadId) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const normalizedThreads = limitRagThreads(threads).map(normalizeRagThread);
    const payload = {
      activeThreadId: normalizedThreads.some((thread) => thread.id === activeThreadId)
        ? activeThreadId
        : normalizedThreads[0]?.id,
      threads: normalizedThreads.map((thread) => ({
        id: thread.id,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: thread.messages.map(serializeMessageForStorage),
      })),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {
    // Ignore storage failures and keep the in-memory session usable.
  }
}

export function buildRagChatHistory(messages) {
  const history = [];

  for (const message of messages || []) {
    if (!isContextMessage(message)) {
      continue;
    }

    history.push({ role: message.role, content: message.content });
  }

  if (!history.length) {
    return [];
  }

  const recentHistory = [];
  let userTurns = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    recentHistory.push(message);

    if (message.role === 'user') {
      userTurns += 1;
      if (userTurns >= MAX_REQUEST_USER_TURNS) {
        break;
      }
    }
  }

  return recentHistory.reverse();
}
