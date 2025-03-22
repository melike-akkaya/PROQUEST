import sys
import numpy as np
import pandas as pd
import os
import sqlite3
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.prott5Embedder import getEmbeddings
from annoy import AnnoyIndex
from datetime import datetime

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

def searchByEmbedding(embedding, index, num_neighbors=250):
    nearest_neighbors = index.get_nns_by_vector(embedding, num_neighbors, include_distances=True)
    return nearest_neighbors

def searchSpecificEmbedding(embedding):
    annoydb = 'asset/protein_embeddings.ann' 
    embeddingDimension = 1024 

    annoy_index = AnnoyIndex(embeddingDimension, 'euclidean')
    annoy_index.load(annoydb)
    neighbors, _ = searchByEmbedding(embedding, annoy_index)
    
    protein_ids = []
    for index_id in neighbors:
        protein_id = runSql("asset/protein_index.db", f"SELECT protein_id FROM id_map WHERE index_id = {index_id}")
        if not protein_id.empty:
            protein_ids.append(protein_id.iloc[0]['protein_id'])
    
    return protein_ids

allSequences = read_fasta("asset/selected_proteins.fasta")
model_dir = None

with open("protein_analysis_results_0.txt", "w") as outfile:
    for key in allSequences:
        sequence = {key: allSequences[key]}
        startTimeToCreateEmbedding = datetime.now()
        embDict, tempDict = getEmbeddings(sequence, None, per_protein=True)
        endTimeToCreateEmbedding = datetime.now()

        for sequence_id, embedding in embDict.items():
            startTimeToFindByEmbedding = datetime.now()
            foundProteinIDs = searchSpecificEmbedding(embedding)
            endTimeToFindByEmbedding = datetime.now()

            embeddingTime = endTimeToCreateEmbedding - startTimeToCreateEmbedding
            searchTime = endTimeToFindByEmbedding - startTimeToFindByEmbedding

            outfile.write(f"{sequence_id}, {embeddingTime.total_seconds()}, {searchTime.total_seconds()}, {', '.join(foundProteinIDs)}\n")