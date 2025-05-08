import pickle
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone_text.sparse import BM25Encoder
from pinecone_text.sparse.bm25_tokenizer import BM25Tokenizer

PERSIST_DIR   = "chroma_uniprot_nomic"        
BM25_PATH     = "bm25_model.pkl"              
EMBED_MODEL   = "nomic-ai/nomic-embed-text-v1"

def build_and_save_bm25(outpath = "bm25_model.pkl"):
    embed = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"trust_remote_code": True},
        encode_kwargs={"normalize_embeddings": True},
    )

    vectordb = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embed,
    )
    all_docs = vectordb._collection.get(include=["documents"])
    chunk_texts = all_docs["documents"] 

    tokenizer = BM25Tokenizer(
        lower_case=True,
        remove_punctuation=True,
        remove_stopwords=True,
        stem=False,
        language="english",
    )
    bm25 = BM25Encoder()
    print("Fitting BM25 on", len(chunk_texts), "chunks…")
    bm25.fit(chunk_texts)
    with open(outpath, "wb") as f:
        pickle.dump((tokenizer, bm25), f)
    print(f"Saved BM25 model to {outpath}")
