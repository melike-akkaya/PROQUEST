import sys
import numpy as np
import pandas as pd
import os
import sqlite3
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.prott5Embedder import getEmbeddings
from annoy import AnnoyIndex
from datetime import datetime
import psutil
import GPUtil

def read_fasta(fasta_path):
    '''
        Reads in fasta file containing multiple sequences.
        Returns dictionary of holding multiple sequences or only single 
        sequence, depending on input file.
    '''
    sequences = dict()
    with open(fasta_path, 'r') as fasta_f:
        for line in fasta_f:
            if line.startswith('>'):
                uniprot_id = line.split("|")[1]
                sequences[uniprot_id] = ''
            else:
                sequences[uniprot_id] += ' '.join(''.join(line.split()).upper().replace("-", ""))  # drop gaps, cast to upper-case, and add spaces between characters
    return sequences

def runSql(dbPath, query):
    conn = sqlite3.connect(dbPath)
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def searchByEmbedding(embedding, index, num_neighbors=5):
    nearest_neighbors = index.get_nns_by_vector(embedding, num_neighbors, include_distances=True)
    return nearest_neighbors

def searchSpecificEmbedding(embedding):
    annoydb = 'protein_embeddings.ann' 
    embeddingDimension = 1024 

    annoy_index = AnnoyIndex(embeddingDimension, 'euclidean')
    annoy_index.load(annoydb)
    neighbors, distances = searchByEmbedding(embedding, annoy_index)
    
    results = pd.DataFrame(columns=['index_id', 'protein_id', 'distance'])
    for index_id, distance in zip(neighbors, distances):
        protein_id = runSql("protein_index.db", f"SELECT protein_id FROM id_map WHERE index_id = {index_id}")
        if not protein_id.empty:
            newRow = pd.DataFrame({'index_id': [index_id], 'protein_id': [protein_id.iloc[0]['protein_id']], 'distance': [distance]})
            newRow = newRow.dropna(axis=1, how='all')
            results = pd.concat([results, newRow], ignore_index=True)
    
    return results

allSequences = read_fasta("uniprot_sprot.fasta")
model_dir = None

results_df = pd.DataFrame()

for key in allSequences:
    sequence = {key: allSequences[key]}
    startTimeToCreateEmbedding = datetime.now()
    embDict = getEmbeddings(sequence, None, per_protein=True)
    endTimeToCreateEmbedding = datetime.now()

    for sequence_id, embedding in embDict.items():
        startTimeToFindByEmbedding = datetime.now()
        foundEmbeddings = searchSpecificEmbedding(embedding)
        endTimeToFindByEmbedding = datetime.now()

        embeddingTime = endTimeToCreateEmbedding - startTimeToCreateEmbedding
        searchTime = endTimeToFindByEmbedding - startTimeToFindByEmbedding
        memory = psutil.virtual_memory()
        cpuUsage = memory.used / (1024 ** 3)

        gpus = GPUtil.getGPUs()
        gpuUsages = [gpu.memoryUsed / 1024 for gpu in gpus]

        all_rows = []
        result_data = {
            'Protein ID': sequence_id,
            'Embedding Duration': embeddingTime.total_seconds(),
            'Search Duration': searchTime.total_seconds(),
            'CPU Usage': cpuUsage
        }
        for i, row in foundEmbeddings.iterrows():
            result_data[f'{i}. Nearest Result'] = f"{row['protein_id']}, {row['distance']}"

        for i, gpuUsages in enumerate(gpuUsages):
            result_data[f'GPU_{i} Usage'] = gpuUsages
        
        all_rows.append(result_data)
        newRow = pd.DataFrame(all_rows)
        results_df = pd.concat([results_df, newRow], ignore_index=True)

results_df.to_excel("protein_analysis_results.xlsx", index=False)