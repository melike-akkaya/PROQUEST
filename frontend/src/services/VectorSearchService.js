import axios from 'axios';

export async function vectorSearch(sequence) {
  const { data } = await axios.post(
    `/vector_search`,
    { sequence }
  );
  return data;
}
