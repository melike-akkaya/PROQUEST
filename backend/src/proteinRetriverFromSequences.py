from datetime import datetime
import pandas as pd
import sqlite3
from src.prott5Embedder import getEmbeddings
from src.relevantProteinFinder import searchSpecificEmbedding

def retrieveRelatedProteinsFromSequences(sequence, db_path="asset/protein_index.db"):
    raw = sequence.strip()
    if raw.startswith(">"):
        seq = "".join(line for line in raw.splitlines() if not line.startswith(">"))
    else:
        seq = raw.replace("\n", "").strip()

    embDict, _ = getEmbeddings(
        seq_dict={"query_protein": seq},
        visualize=True,
        per_protein=True
    )

    try:
        query_embedding = embDict["query_protein"]
    except KeyError:
        raise ValueError(f"Embedding dict missing key 'query_protein'; got {list(embDict.keys())}")

    df = searchSpecificEmbedding(query_embedding)
    df_final = df[df["Similarity"] >= 0.90]
    found = df_final.to_dict(orient="records")

    proteins = [
        rec["Protein ID"].strip("<>").split(">")[-1]
        for rec in found
    ]

    if not proteins:
        print ("not proteins")
        return pd.DataFrame(columns=["Protein ID", "Content"])

    conn = sqlite3.connect(db_path)
    placeholders = ",".join("?" for _ in proteins)

    query = f"""
        SELECT m.protein_id, f.content
        FROM flat_files f
        JOIN flat_files_mapping m ON f.file_id = m.file_id
        WHERE m.protein_id IN ({placeholders})
    """
    df = pd.read_sql_query(query, conn, params=proteins)
    conn.close()

    df = (
        df
        .rename(columns={"protein_id": "Protein ID", "content": "Content"})
        .reset_index(drop=True)
    )

    return df