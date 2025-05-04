import os
import re
import sqlite3
import torch
from transformers import AutoTokenizer
from langchain_community.vectorstores import Chroma
from langchain_community.docstore.document import Document
from langchain_huggingface import HuggingFaceEmbeddings

# ───────────────────────────────────────────────
# Configuration
# ───────────────────────────────────────────────
modelName        = "nomic-ai/nomic-embed-text-v1"
device           = "cuda:3" if torch.cuda.is_available() else "cpu"
chunkTokens      = 4096
overlapTokens    = 512
modelMaxTokens   = 8192
sqlitePath       = "backend/asset/protein_index.db"
tableName        = "flat_files"

# ───────────────────────────────────────────────
# Shared tokenizer
# ───────────────────────────────────────────────
print(f"Loading tokenizer for {modelName}")
tokenizer = AutoTokenizer.from_pretrained(
    modelName, trust_remote_code=True, use_fast=True
)

# ───────────────────────────────────────────────
# SQLite helpers
# ───────────────────────────────────────────────
def initSqlite(path: str = sqlitePath):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    with conn:
        conn.execute(
            f"""CREATE TABLE IF NOT EXISTS {tableName} (
                   protein_id TEXT PRIMARY KEY, 
                   content    TEXT    NOT NULL
               )"""
        )
    return conn


def storeRecordsSqlite(conn: sqlite3.Connection, recordList):
    cursor = conn.cursor()
    for recordIndex, recordContent in enumerate(recordList):
        cursor.execute(
            f"INSERT OR IGNORE INTO {tableName} (protein_id, content) VALUES (?, ?);",
            (recordIndex, recordContent)
        )
    conn.commit()

# ───────────────────────────────────────────────
# File loading & cleaning
# ───────────────────────────────────────────────
def loadRecords(filePath, delimiter=r"^//[ \t]*\r?\n(?=ID)"):
    print(f"Loading records from {filePath}")
    with open(filePath, encoding="utf-8") as fh:
        fullText = fh.read()

    rawRecords = [
        chunk.strip()
        for chunk in re.split(delimiter, fullText, flags=re.MULTILINE)
        if chunk.strip()
    ]
    print(f"Loaded {len(rawRecords)} raw records.")

    cleanedRecords = []
    for recordIndex, rawRecord in enumerate(rawRecords):
        filteredLines, inSequence = [], False
        for line in rawRecord.splitlines():
            if line.startswith("SQ") or line.startswith(" "):
                inSequence = True
            else:
                inSequence = False
            if inSequence:
                continue
            filteredLines.append(line)
        cleanedText = "\n".join(filteredLines).strip()
        cleanedRecords.append(cleanedText)

        if (recordIndex + 1) % 10_000 == 0:
            print(f"  • Processed {recordIndex + 1} records…")

    print(f"Cleaned {len(cleanedRecords)} records (sequence sections removed).")
    return cleanedRecords

# ───────────────────────────────────────────────
# Chunking
# ───────────────────────────────────────────────
def chunkRecords(recordsList):
    """
    Slice each record into chunkTokens windows (with overlapTokens overlap).
    Each chunk stores only (protein_id, chunk_id) as metadata.
    """
    print("Token-based splitting of records…")
    chunkList = []

    for recordIndex, recordText in enumerate(recordsList):
        tokenIds = tokenizer.encode(recordText, add_special_tokens=False)
        start, chunkId = 0, 0
        while start < len(tokenIds):
            segmentIds = tokenIds[start : start + chunkTokens]
            chunkText = tokenizer.decode(
                segmentIds,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )

            # safety net (shouldn’t trigger)
            if len(tokenizer.encode(chunkText, add_special_tokens=False)) > modelMaxTokens:
                truncated = tokenizer.encode(chunkText, add_special_tokens=False)[:modelMaxTokens]
                chunkText = tokenizer.decode(
                    truncated,
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True,
                )

            chunkList.append(
                Document(
                    page_content=chunkText,
                    metadata={"protein_id": recordIndex, "chunk_id": chunkId},
                )
            )
            start += chunkTokens - overlapTokens
            chunkId += 1

        if (recordIndex + 1) % 5_000 == 0:
            print(f"  • Chunked {recordIndex + 1} records…")

    print(f"Generated {len(chunkList)} chunks from {len(recordsList)} records.")
    return chunkList

# ───────────────────────────────────────────────
# Build / persist vector DB
# ───────────────────────────────────────────────
def createVectorDb(
    filePath="backend/asset/uniprot_sprot.dat",
    persistDirectory="uniprot_flat_files",
):
    print("Building UniProt → Chroma index with Nomic embeddings…")

    # 1. Parse & clean
    recordsList = loadRecords(filePath)

    # 2. Store full records once in SQLite (protein_id is PK)
    conn = initSqlite(sqlitePath)
    storeRecordsSqlite(conn, recordsList)
    print(f"Inserted {len(recordsList)} rows into {sqlitePath}.")

    # 3. Chunk for embedding
    chunkList = chunkRecords(recordsList)

    # 4. Embedding model
    print(f"Loading embedding model on {device}…")
    embedFunction = HuggingFaceEmbeddings(
        model_name=modelName,
        model_kwargs={"device": device, "trust_remote_code": True},
        encode_kwargs={"normalize_embeddings": True},
    )

    # 5. Embed & persist
    print(f"Embedding & indexing {len(chunkList)} chunks …")
    vectorDb = Chroma.from_documents(
        documents=chunkList,
        embedding=embedFunction,
        persist_directory=persistDirectory,
    )
    vectorDb.persist()
    print("Done! Chroma vector database written to:", persistDirectory)


createVectorDb()
