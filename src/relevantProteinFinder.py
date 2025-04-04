
import sqlite3
import pandas as pd
from annoy import AnnoyIndex

def searchSpecificEmbedding(embedding):
    annoydb = 'asset/protein_embeddings_2.ann'
    embeddingDimension = 1024

    annoyIndex = AnnoyIndex(embeddingDimension, 'angular')
    annoyIndex.load(annoydb)
    neighbors, distances = annoyIndex.get_nns_by_vector(embedding, 250, include_distances=True)
    
    columns = ['Protein ID', 'Similarity', 'Short Name', 'Protein Name', 'Organism', 'Taxon ID', 'Gene Name', 'pe', 'sv']
    results = pd.DataFrame(columns=columns)
    
    for index_id, distance in zip(neighbors, distances):
        dbPath = "asset/protein_index.db"
        conn = sqlite3.connect(dbPath)
        proteinIdDf = pd.read_sql_query(f"SELECT protein_id FROM id_map WHERE index_id = {index_id}", conn)

        if not proteinIdDf.empty:
            proteinId = proteinIdDf.iloc[0]['protein_id']

            df = pd.read_sql_query(f"SELECT protein_name, type, os, ox, gn, pe, sv FROM protein_info WHERE protein_id = '{proteinId}'", conn)
            conn.close()
            if not df.empty:
                newRow = {
                    'Protein ID': proteinId,
                    'Similarity': 1 - distance,
                    'Short Name': df.iloc[0]['protein_name'],
                    'Protein Name': df.iloc[0]['type'],
                    'Organism': df.iloc[0]['os'],
                    'Taxon ID': df.iloc[0]['ox'],
                    'Gene Name': df.iloc[0]['gn'],
                    'pe': df.iloc[0]['pe'],
                    'sv': df.iloc[0]['sv']
                }
            else :
                newRow = {
                    'Protein ID': proteinId,
                    'Similarity': 1 - distance,
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
