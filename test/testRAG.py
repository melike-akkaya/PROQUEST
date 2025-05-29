import os
import json
import requests

BASE_URL = 'http://localhost:8000'
#MODEL = 'gemini-2.0-flash-thinking-exp-01-21'
MODEL = 'gemini-2.5-flash-preview-04-17'

API_KEY = 'AIzaSyDU_IA3R3O54xcg6ncf48YD5ddFL6xXqsg'

FALLBACK_MESSAGE = "I don’t have enough information to answer that based on the provided records."
MAX_RETRIES = 5

def load_inputs(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def query_rag(model, api_key, question, sequence, top_k, temperature=None):
    payload = {
        'model': model,
        'api_key': api_key,
        'question': question,
        'sequence': sequence,
        'top_k': top_k
    }

    if temperature is not None:
        payload['temperature'] = temperature

    response = requests.post(f'{BASE_URL}/rag_order', json=payload)
    response.raise_for_status()
    data = response.json()

    return {
        'answer': data.get('answer'),
        'proteinIds': data.get('protein_ids')
    }

def run_batch_tests():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(current_dir, 'testRAG_inputs.json')

    with open(input_path, 'r', encoding='utf-8') as f:
        inputs = json.load(f)

    for index, item in enumerate(inputs):
        question = item.get('question')
        sequence = item.get('sequence', '')
        top_k = item.get('topK', 10)
        temperature = item.get('temperature', 1.0)

        if not question:
            print(f"Missing question at index {index}, skipping...")
            continue

        print(f"\n[{index + 1}] Question: {question}")

        try:
            attempt = 0
            result = None

            while attempt < MAX_RETRIES:
                result = query_rag(MODEL, API_KEY, question, sequence, top_k, temperature)
                if result['answer'].strip() != FALLBACK_MESSAGE:
                    break
                attempt += 1
                print(f"Retrying... Attempt {attempt + 1}")

            print("Answer:", result['answer'])
            print("Protein IDs:", result['proteinIds'])

        except requests.RequestException as err:
            print("Error:", err)

if __name__ == '__main__':
    run_batch_tests()
