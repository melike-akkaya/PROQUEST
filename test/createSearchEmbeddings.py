import pandas as pd
import requests
import json
from datetime import datetime

def read_fasta(fasta_path):
    sequences = dict()
    with open(fasta_path, 'r') as fasta_f:
        for line in fasta_f:
            if line.startswith('>'):
                uniprot_id = line.split("|")[1]
                sequences[uniprot_id] = ''
            else:
                sequences[uniprot_id] += ''.join(line.split()).upper().replace("-", "")
    return sequences

FASTA_PATH = "asset/selected_proteins.fasta"
API_URL = "http://localhost:8000/vector_search"
OUTPUT_FILE = "protein_analysis_results_from_api.xlsx"

all_sequences = read_fasta(FASTA_PATH)

results_df = pd.DataFrame()

for protein_id, sequence in all_sequences.items():
    print(f"[INFO] Processing: {protein_id}")

    start_total = datetime.now()
    try:
        response = requests.post(
            API_URL,
            json={"sequence": sequence}
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] API request failed for {protein_id}: {e}")
        continue

    data = response.json()
    total_duration = (datetime.now() - start_total).total_seconds()

    row_data = {
        'Protein ID': protein_id,
        'Embedding Duration (in seconds)': data.get("embedding_time", None),
        'Search Duration (in seconds)': data.get("search_time", None),
        'Total Duration (in seconds)': total_duration
    }

    results_df = pd.concat([results_df, pd.DataFrame([row_data])], ignore_index=True)

results_df.to_excel(OUTPUT_FILE, index=False)