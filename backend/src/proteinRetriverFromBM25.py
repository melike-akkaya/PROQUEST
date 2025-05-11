import pickle
import sqlite3
import numpy as np
from joblib import dump, load
import os
import pandas as pd

CACHE_PATH = "asset/docs_sp.joblib"
BM25_PATH   = "asset/bm25_model_fromflatfiles.pkl"
DB_PATH     = "asset/protein_index.db"

# ── module‐level cache ───────────────────────────────────────────────────────
_bm25     = None
_docs     = None
_docs_sp  = None

def bm25_initialize():
    global _bm25, _docs, _docs_sp

    if _bm25 is None:
        with open(BM25_PATH, "rb") as f:
            _, _bm25 = pickle.load(f)

    if _docs is None:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT content FROM flat_files")
        _docs = [row[0] for row in cur.fetchall()]
        conn.close()

    if _docs_sp is None:
        if os.path.exists(CACHE_PATH):
            _docs_sp = load(CACHE_PATH)
            print(f"[proteinRetriverFromBM25]: Loaded preprocessed docs from {CACHE_PATH}")
        else:
            print("[proteinRetriverFromBM25]: Preprocessing documents for BM25 (this may take a while)...")
            docs_sp = []
            for text in _docs:
                sp = _bm25.encode_documents(text)
                docs_sp.append((sp["indices"], np.array(sp["values"])))
            dump(docs_sp, CACHE_PATH, compress=3)
            print(f"[proteinRetriverFromBM25]: Saved preprocessed docs to {CACHE_PATH}")
            _docs_sp = docs_sp

def retrieveRelatedProteinsFromBM25(query_text, top_k):
    bm25_initialize()

    q_sp   = _bm25.encode_queries(query_text)
    q_idx  = q_sp["indices"]
    q_vals = np.array(q_sp["values"])

    scores = []
    for i, (d_idx, d_vals) in enumerate(_docs_sp):
        common = set(q_idx).intersection(d_idx)
        if common:
            q_mask = [q_idx.index(tok) for tok in common]
            d_mask = [d_idx.index(tok) for tok in common]
            score  = float(np.dot(q_vals[q_mask], d_vals[d_mask]))
        else:
            score = 0.0
        scores.append((i, score))

    hits     = sorted(scores, key=lambda x: x[1], reverse=True)[:top_k]
    file_ids = [idx for idx, _ in hits]

    if not file_ids:
        # return empty DataFrame if no hits
        return pd.DataFrame(columns=["Protein ID", "Content"])

    placeholders = ",".join("?" for _ in file_ids)
    sql = f"""
        SELECT
            ffm.protein_id   AS protein_id,
            ff.content       AS content
        FROM flat_files AS ff
        JOIN flat_files_mapping AS ffm
          ON ff.file_id = ffm.file_id
        WHERE ff.file_id IN ({placeholders})
    """

    conn = sqlite3.connect(DB_PATH)
    df   = pd.read_sql_query(sql, conn, params=file_ids)
    conn.close()

    return (
        df
        .rename(columns={"protein_id": "Protein ID", "content": "Content"})
        .reset_index(drop=True)
    )