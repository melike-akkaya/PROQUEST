import axios from 'axios';

export async function vectorSearch(sequence, similarityThreshold = 0.8) {
  const { data } = await axios.post(
    `/vector_search`,
    { sequence, similarity_threshold: similarityThreshold }
  );
  return data;
}
