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
    dbPath = "asset/protein_index2.db"

    for index_id in neighbors:
        conn = sqlite3.connect(dbPath)
        proteinIdDf = pd.read_sql_query(
            f"SELECT protein_id FROM id_map WHERE index_id = {index_id}", conn
        )

        if proteinIdDf.empty:
            conn.close()
            continue

        proteinId = proteinIdDf.iloc[0]['protein_id']
        infoDf = pd.read_sql_query(
            f"SELECT protein_name, type, os, ox, gn, pe, sv FROM protein_info WHERE protein_id = '{proteinId}'", 
            conn
        )
        conn.close()

        vector = annoyIndex.get_item_vector(index_id)
        similarity = round(cosineSimilarity(embedding, vector), 4)

        # stop the loop once similarity < 0.8
        if similarity < 0.8:
            break

        if not infoDf.empty:
            row = {
                'Protein ID': proteinId,
                'Similarity': similarity,
                'Short Name': infoDf.iloc[0]['protein_name'],
                'Protein Name': infoDf.iloc[0]['type'],
                'Organism': infoDf.iloc[0]['os'],
                'Taxon ID': infoDf.iloc[0]['ox'],
                'Gene Name': infoDf.iloc[0]['gn'],
                'pe': infoDf.iloc[0]['pe'],
                'sv': infoDf.iloc[0]['sv']
            }
        else:
            row = dict.fromkeys(columns, "")
            row['Protein ID'] = proteinId
            row['Similarity'] = similarity

        results.loc[len(results)] = row

    return results
