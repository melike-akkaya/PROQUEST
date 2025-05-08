import axios from 'axios';

export async function queryLLM({ model, apiKey, verbose, limit, retryCount, question , temperature}) {
  const payload = {
    model,
    api_key: apiKey,
    verbose,
    limit,
    retry_count: retryCount,
    question
  };
  
  if (temperature !== null && temperature !== undefined) {
    payload.temperature = temperature;
  }

  const { data } = await axios.post(`/llm_query`, payload);
  return {
    solr_query: data.solr_query,
    results: data.results?.results || [],
    logs: data.logs || null
  };
}
