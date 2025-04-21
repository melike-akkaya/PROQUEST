import sqlite3
import pandas as pd
from annoy import AnnoyIndex
import numpy as np

def cosineSimilarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def searchSpecificEmbedding(embedding):
    annoydb = 'asset/protein_embeddings_2.ann'
    embeddingDimension = 1024

    annoyIndex = AnnoyIndex(embeddingDimension, 'angular')
    annoyIndex.load(annoydb)
    neighbors = annoyIndex.get_nns_by_vector(embedding, 250, include_distances=False)
    
    columns = ['Protein ID', 'Similarity', 'Short Name', 'Protein Name', 'Organism', 'Taxon ID', 'Gene Name', 'pe', 'sv']
    results = pd.DataFrame(columns=columns)
    
    for index_id in neighbors:
        dbPath = "asset/protein_index.db"
        conn = sqlite3.connect(dbPath)
        proteinIdDf = pd.read_sql_query(f"SELECT protein_id FROM id_map WHERE index_id = {index_id}", conn)

        if not proteinIdDf.empty:
            proteinId = proteinIdDf.iloc[0]['protein_id']

            df = pd.read_sql_query(f"SELECT protein_name, type, os, ox, gn, pe, sv FROM protein_info WHERE protein_id = '{proteinId}'", conn)
            
            vector = annoyIndex.get_item_vector(index_id)
            similarity = round(cosineSimilarity(embedding, vector), 4)
            conn.close()

            if not df.empty:
                newRow = {
                    'Protein ID': proteinId,
                    'Similarity': similarity,
                    'Short Name': df.iloc[0]['protein_name'],
                    'Protein Name': df.iloc[0]['type'],
                    'Organism': df.iloc[0]['os'],
                    'Taxon ID': df.iloc[0]['ox'],
                    'Gene Name': df.iloc[0]['gn'],
                    'pe': df.iloc[0]['pe'],
                    'sv': df.iloc[0]['sv']
                }
            else:
                newRow = {
                    'Protein ID': proteinId,
                    'Similarity': similarity,
                    'Short Name': "",
                    'Protein Name': "",
                    'Organism': "",
                    'Taxon ID': "",
                    'Gene Name': "",
                    'pe': "",
                    'sv': ""
                }
        
            results.loc[len(results)] = newRow
            
    return results
