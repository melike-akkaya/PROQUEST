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
        x=0
        for line in fasta_f:
            if line.startswith('>'):
                uniprot_id = line.split("|")[1]
                sequences[uniprot_id] = ''
            else:
                sequences[uniprot_id] += ' '.join(''.join(line.split()).upper().replace("-", ""))  # drop gaps, cast to upper-case, and add spaces between characters
    return sequences

def runSql(dbPath, query):
    conn = sqlite3.connect(dbPath)
    c = conn.cursor()
    c.execute(query)
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def searchByEmbedding(embedding, index, num_neighbors=5):
    nearest_neighbors = index.get_nns_by_vector(embedding, num_neighbors, include_distances=True)
    return nearest_neighbors

def searchSpecificEmbedding(emb_dict):
    annoydb = 'protein_embeddings.ann' 
    embeddingDimension = 1024 
    
    for sequence_id, embedding in emb_dict.items():
        print(sequence_id)
    
        annoy_index = AnnoyIndex(embeddingDimension, 'euclidean')
        annoy_index.load(annoydb)

        neighbors, distances = searchByEmbedding(embedding, annoy_index)

        results = pd.DataFrame(columns=['index_id', 'protein_id', 'distance'])

        for index_id, distance in zip(neighbors, distances):
            protein_id = runSql("protein_index.db", f"SELECT protein_id FROM id_map WHERE index_id = {index_id}")
            if not protein_id.empty:
                newRow = pd.DataFrame({'index_id': [index_id], 'protein_id': [protein_id.iloc[0]['protein_id']], 'distance': [distance]})
                results = pd.concat([results, newRow], ignore_index=True)

        for index, row in results.iterrows():
            print(f"Index ID: {row['index_id']}, Protein ID: {row['protein_id']}, Distance: {row['distance']}")
        
        break

allSequences = read_fasta("uniprot_sprot.fasta")
model_dir = None

x = 0
for key in allSequences:
    sequence = dict()
    sequence[key] = allSequences[key]

    startTimeToCreateEmbedding = datetime.now()
    embDict = getEmbeddings(sequence, model_dir, per_protein=True)
    endTimeToCreateEmbedding = datetime.now()

    startTimeToFindByEmbedding = datetime.now()
    searchSpecificEmbedding(embDict)
    endTimeToFindByEmbedding = datetime.now()
    
    print("Duration to create embedding: " + str(endTimeToCreateEmbedding - startTimeToCreateEmbedding))
    print("Duration to find by embedding: " + str(endTimeToFindByEmbedding - startTimeToFindByEmbedding))

    memory = psutil.virtual_memory()
    usedMemory = memory.used / (1024 ** 3)
    print(f"Used CPU: {usedMemory:.2f} GB")

    gpus = GPUtil.getGPUs()
    for gpu in gpus:
        usedMemory = gpu.memoryUsed / 1024
        print(f"GPU ID: {gpu.id} - Used Memory: {usedMemory:.2f} GB")