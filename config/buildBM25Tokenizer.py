import pickle
import sqlite3
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone_text.sparse import BM25Encoder
from pinecone_text.sparse.bm25_tokenizer import BM25Tokenizer

PERSIST_DIR   = "chroma_uniprot_nomic"        
BM25_PATH     = "bm25_model_fromflatfiles.pkl"              
EMBED_MODEL   = "nomic-ai/nomic-embed-text-v1"
DB_PATH       = "backend/asset/protein_index.db"

def build_and_save_bm25(outpath = BM25_PATH):    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM flat_files")
    rows = cursor.fetchall()
    conn.close()
    
    chunk_texts = [row[0] for row in rows]
    
    tokenizer = BM25Tokenizer(
        lower_case=True,
        remove_punctuation=True,
        remove_stopwords=True,
        stem=False,
        language="english",
    )
    bm25 = BM25Encoder()
    
    print("Fitting BM25 on", len(chunk_texts), "documents…")
    bm25.fit(chunk_texts)
    
    with open(outpath, "wb") as f:
        pickle.dump((tokenizer, bm25), f)
    print(f"Saved BM25 model to {outpath}")

build_and_save_bm25()
