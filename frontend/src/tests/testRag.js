import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { queryRAG, fetchRAGProteinInfo } from '../services/RAGService.js';

axios.defaults.baseURL = 'http://localhost:8000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const model = 'gemini-2.0-flash-thinking-exp-01-21';
const apiKey = '';

async function runBatchTests() {
  const inputPath = path.join(__dirname, 'testRAG_inputs.json');
  const raw = await fs.readFile(inputPath, 'utf-8');
  const inputs = JSON.parse(raw);

  for (const [index, item] of inputs.entries()) {
    const { question, sequence, topK = 10, temperature = 1.0 } = item;

    if (!question) {
      console.warn(`Missing question at index ${index}, skipping...`);
      continue;
    }

    console.log(`\n[${index + 1}] Question: ${question}`);

    try {
      const queryParams = {
        model,
        apiKey,
        question,
        sequence: typeof sequence === 'string' ? sequence : "",
        topK,
        temperature
      };

      const { answer, proteinIds } = await queryRAG(queryParams);

      console.log('Answer:', answer);
      console.log('Protein IDs:', proteinIds);
    } catch (err) {
      console.error(' Error:', err.response?.data || err.message || err);
    }
  }
}

runBatchTests();
