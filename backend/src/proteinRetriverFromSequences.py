import pandas as pd
import sqlite3
from annoy import AnnoyIndex
from src.prott5Embedder import getEmbeddings

def searchSpecificEmbedding(embedding, topK, annoydb="asset/protein_embeddings_2.ann", db_path="asset/protein_index.db", embeddingDimension=1024):
    """
    Given a query embedding, return a DataFrame of the topK nearest
    proteins (by angular distance) from the Annoy index plus info
    from SQLite.
    """
    # load Annoy index
    annoyIndex = AnnoyIndex(embeddingDimension, 'angular')
    annoyIndex.load(annoydb)

    # get the topK nearest neighbor index IDs
    neighbor_ids, distances = annoyIndex.get_nns_by_vector(embedding, topK, include_distances=True) # this result should be ordered by distances (angular in this case)

    columns = [
        'Protein ID','Short Name','Protein Name',
        'Organism','Taxon ID','Gene Name','pe','sv'
    ]
    records = []

    # look up each hit in the SQLite tables
    for idx in neighbor_ids:
        # map Annoy index -> protein_id
        conn = sqlite3.connect(db_path)
        pid_df = pd.read_sql_query(
            f"SELECT protein_id FROM id_map WHERE index_id = {idx}", conn
        )
        if pid_df.empty:
            conn.close()
            continue
        pid = pid_df.iloc[0]['protein_id']

        # fetch metadata
        info_df = pd.read_sql_query(
            f"""
            SELECT protein_name, type, os, ox, gn, pe, sv
            FROM protein_info
            WHERE protein_id = '{pid}'
            """,
            conn
        )
        conn.close()

        # build row
        if not info_df.empty:
            info = info_df.iloc[0]
            row = {
                'Protein ID': pid,
                'Short Name': info['protein_name'],
                'Protein Name': info['type'],
                'Organism': info['os'],
                'Taxon ID': info['ox'],
                'Gene Name': info['gn'],
                'pe': info['pe'],
                'sv': info['sv']
            }
        else:
            row = dict.fromkeys(columns, "")
            row['Protein ID'] = pid

        records.append(row)

    result_df = pd.DataFrame(records, columns=columns)
    result_df = (
        result_df
        .head(topK)
        .reset_index(drop=True)
    )
    return result_df


def retrieveRelatedProteinsFromSequences(sequence, topK, db_path="asset/protein_index.db"):
    """
    Embed a query sequence, fetch the topK most similar proteins
    via searchSpecificEmbedding, then pull their full content.-
    """
    # strip FASTA header if present
    raw = sequence.strip()
    if raw.startswith(">"):
        seq = "".join(line for line in raw.splitlines() if not line.startswith(">"))
    else:
        seq = raw.replace("\n", "").strip()

    # get the embedding
    embDict, _ = getEmbeddings(
        seq_dict={"query_protein": seq},
        visualize=True,
        per_protein=True
    )
    if "query_protein" not in embDict:
        raise ValueError(
            f"Embedding dict missing key 'query_protein'; got {list(embDict.keys())}"
        )
    query_emb = embDict["query_protein"]

    # retrieve topK similar proteins (metadata + similarity)
    sim_df = searchSpecificEmbedding(query_emb, topK=topK)

    # extract just the IDs
    proteins = sim_df["Protein ID"].tolist()
    if not proteins:
        # no hits -> empty result
        return pd.DataFrame(columns=["Protein ID", "Content"])

    # query the content table for these proteins
    conn = sqlite3.connect(db_path)
    ph = ",".join("?" for _ in proteins)
    sql = f"""
        SELECT m.protein_id, f.content
        FROM flat_files f
        JOIN flat_files_mapping m ON f.file_id = m.file_id
        WHERE m.protein_id IN ({ph})
    """
    content_df = pd.read_sql_query(sql, conn, params=proteins)
    conn.close()

    return (
        content_df
        .rename(columns={"protein_id": "Protein ID", "content": "Content"})
        .reset_index(drop=True)
    )
