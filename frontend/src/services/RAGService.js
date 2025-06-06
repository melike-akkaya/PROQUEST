import axios from 'axios';

export async function queryRAG({
  model,
  apiKey,
  question,
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

  if (temperature !== null) {
    payload.temperature = temperature;
  }

  const { data } = await axios.post('/rag_order', payload);
  return {
    answer: data.answer,
    proteinIds: data.protein_ids
  };
}

export async function fetchRAGProteinInfo(proteinIds) {
  const payload = {
    protein_ids: proteinIds
  };

  const { data } = await axios.post('/rag_order/protein_info', payload);
  return data.found_info;
}
