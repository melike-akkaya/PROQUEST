import axios from 'axios';

export async function queryRAG({
  model,
  apiKey,
  question,
  chatHistory,
  sequence,
  topK,
  temperature = null
}) {
  const payload = {
    model,
    api_key: apiKey,
    question,
    sequence,
    top_k: topK
  };

  if (chatHistory?.length) {
    payload.chat_history = chatHistory;
  }

  if (temperature !== null) {
    payload.temperature = temperature;
  }

  const { data } = await axios.post('/rag_order', payload);
  return {
    answer: data.answer,
    proteinIds: data.protein_ids,
    suggestedFollowUps: data.suggested_followups || [],
    tokenUsage: data.token_usage || null,
  };
}

export async function fetchRAGProteinInfo(proteinIds) {
  const payload = {
    protein_ids: proteinIds
  };

  const { data } = await axios.post('/rag_order/protein_info', payload);
  return data.found_info;
}
