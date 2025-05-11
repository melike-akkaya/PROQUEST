import sqlite3
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# module‐level cache
_embedder: HuggingFaceEmbeddings | None = None
_vectordb: Chroma | None = None

def load_vectorstore(chroma_dir = "asset/chroma_uniprot_nomic") -> Chroma:
    """
    Instantiate (or reuse) a HuggingFaceEmbeddings + Chroma vectorstore
    """
    global _embedder, _vectordb
    if _embedder is None or _vectordb is None:
        # initialize once
        _embedder = HuggingFaceEmbeddings(
            model_name="nomic-ai/nomic-embed-text-v1",
            model_kwargs={"trust_remote_code": True},
            encode_kwargs={"normalize_embeddings": True},
        )
        _vectordb = Chroma(
            persist_directory=chroma_dir,
            embedding_function=_embedder
        )
    return _vectordb

def retrieveRelatedProteins(query, top_k, db_path = "asset/protein_index.db"):
    # get or create the shared vectorstore
    global _vectordb
    
    if (_vectordb == None):
        print("WARNING : vectordb is none")
        _vectordb = load_vectorstore()

    docs = _vectordb.similarity_search(query, k=top_k)
    file_ids = [doc.metadata["protein_id"] for doc in docs]

    if not file_ids:
        return pd.DataFrame(columns=["Protein ID", "Content"])

    placeholders = ",".join("?" for _ in file_ids)
    sql = f"""
      SELECT ffm.protein_id, content 
      FROM flat_files ff 
      JOIN flat_files_mapping ffm 
      ON ffm.file_id = ff.file_id
      WHERE ff.file_id IN ({placeholders});
    """
    conn = sqlite3.connect(db_path)
    df   = pd.read_sql_query(sql, conn, params=file_ids)
    conn.close()

    return (
        df.rename(columns={"protein_id": "Protein ID", "content": "Content"})
          .reset_index(drop=True)
    )