import sqlite3
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def retrieveRelatedProteins(query, top_k, chroma_dir = "chroma_uniprot_nomic", db_path = "backend/asset/protein_index.db"):
    embedder = HuggingFaceEmbeddings(
        model_name="nomic-ai/nomic-embed-text-v1",
        model_kwargs={"trust_remote_code": True},
        encode_kwargs={"normalize_embeddings": True},
    )

    vectordb = Chroma(
        persist_directory=chroma_dir,
        embedding_function=embedder
    )

    docs = vectordb.similarity_search(query, k=top_k)

    file_ids = []
    for doc in docs:
        fid = doc.metadata["protein_id"] # !!! chromadb güncellendikten sonra file_id olarak güncellenecek
        file_ids.append(fid)


    if not file_ids:
        return pd.DataFrame(
            columns=[
                "Protein ID", "Content"
            ]
        )

    placeholders = ",".join("?" for _ in file_ids)
    sql = f"""
    SELECT ffm.protein_id, content 
    FROM flat_files ff 
    JOIN flat_files_mapping ffm 
    WHERE ff.file_id IN ({placeholders})
    AND ffm.file_id = ff.file_id;
    """
    conn = sqlite3.connect(db_path)
    df   = pd.read_sql_query(sql, conn, params=file_ids)
    conn.close()

    df = (
        df
        .rename(columns={
            "protein_id": "Protein ID",
            "content": "Content"
        })
        .reset_index(drop=True)
    )

    return df

df = retrieveRelatedProteins(
    "What proteins are related to Alzheimer's disease?",
    top_k=10
)
print(df)
