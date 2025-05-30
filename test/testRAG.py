import os
import json
import requests
import pandas as pd
from requests.exceptions import RequestException

BASE_URL = 'http://localhost:8000'
FALLBACK_MESSAGE = "I don’t have enough information to answer that based on the provided records."
MAX_RETRIES = 5

MODEL_API_KEYS = {

}

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

    resp = requests.post(f'{BASE_URL}/rag_order', json=payload)
    resp.raise_for_status()
    data = resp.json()
    return {
        'answer': data.get('answer', '').strip(),
        'proteinIds': data.get('protein_ids', [])
    }

def run_batch_tests():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(current_dir, 'testRAG_inputs.json')
    inputs = load_inputs(input_path)

    output_file = os.path.join(current_dir, 'Sequence Search Analysis.xlsx')
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:

        for model, api_key in MODEL_API_KEYS.items():
            rows = []

            for item in inputs:
                question   = item.get('question')
                sequence   = item.get('sequence', '')
                top_k      = item.get('topK',    10)
                temperature= item.get('temperature', 1.0)

                if not question:
                    continue

                attempt = 0
                result = {'answer': FALLBACK_MESSAGE, 'proteinIds': []}

                while attempt < MAX_RETRIES:
                    attempt += 1
                    try:
                        resp = query_rag(model, api_key, question, sequence, top_k, temperature)
                    except RequestException as e:
                        result = {
                            'answer': f"Error: {e}",
                            'proteinIds': []
                        }
                        break
                    else:
                        result = resp
                        if resp['answer'] != FALLBACK_MESSAGE:
                            break

                rows.append({
                    'question':   question,
                    'proteinIds': (
                        ','.join(result['proteinIds'])
                        if isinstance(result['proteinIds'], list)
                        else result['proteinIds']
                    ),
                    'answer':     result['answer'],
                    'attemptNo':  attempt
                })

            sheet_name = model.replace('/', '_')[:31]
            df = pd.DataFrame(rows, columns=['question', 'proteinIds', 'answer', 'attemptNo'])
            df.to_excel(writer, sheet_name=sheet_name, index=False)

    print(f"Results written to {output_file}")

run_batch_tests()
