from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import logging, io, time, sqlite3
from datetime import datetime
from typing import List

import os
import pandas as pd
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI, ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_mistralai.chat_models import ChatMistralAI
from langchain_groq import ChatGroq

from src.prompt import query_uniprot, generate_solr_query
from src.promptForRag import RAGGenerationError, answerWithProteins
from src.relevantGOIdFinder import findRelatedGoIds
from src.relevantProteinFinder import searchSpecificEmbedding
from src.prott5Embedder import load_t5, getEmbeddings
from src.proteinRetriverFromFlatFiles import load_vectorstore
from src.proteinRetriverFromBM25 import bm25_initialize

from configModels import get_provider_for_model_name

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

sqliteDb = "asset/protein_index2.db"

# set up in-memory log capture
log_stream = io.StringIO()
logging.basicConfig(
    stream=log_stream,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("backend")


# Models that don't support temperature parameter (OpenAI reasoning-style)
NO_TEMP_MODELS = {
    "gpt-5.1",
    "gpt-5",
    "gpt-5-nano",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4.1-nano",
    "o4-mini",
    "o3",
    "o3-mini",
    "o1",
}

PROVIDER_ENV_VARS = {
    "OpenAI": "OPENAI_API_KEY",
    "Google": "GOOGLE_API_KEY",
    "Anthropic": "ANTHROPIC_API_KEY",
    "Groq": "GROQ_API_KEY",
    "Mistral": "MISTRAL_API_KEY",
    "Nvidia": "NVIDIA_API_KEY",
    "OpenRouter": "OPENROUTER_API_KEY",
}


def build_llm(model_name: str, api_key: str | None, temperature: float | None, chat_mode: bool = False):
    provider = get_provider_for_model_name(model_name)
    if not provider:
        raise ValueError(f"Unsupported model {model_name}: no provider found")

    if not api_key:
        env_var = PROVIDER_ENV_VARS.get(provider)
        if env_var:
            api_key = os.getenv(env_var)

    kwargs = {}
    if temperature is not None and model_name not in NO_TEMP_MODELS:
        kwargs["temperature"] = temperature

    if provider == "OpenAI":
        return ChatOpenAI(model=model_name, api_key=api_key, **kwargs)

    if provider == "Google":
        google_model = ChatGoogleGenerativeAI if chat_mode else GoogleGenerativeAI
        return google_model(model=model_name, google_api_key=api_key, **kwargs)

    if provider == "Anthropic":
        return ChatAnthropic(
            model=model_name,
            anthropic_api_key=api_key,
            **kwargs,
        )

    if provider == "Groq":
        return ChatGroq(
            model_name=model_name,
            groq_api_key=api_key,
            **kwargs,
        )

    if provider == "Mistral":
        return ChatMistralAI(
            model=model_name,
            api_key=api_key,
            **kwargs,
        )

    if provider == "Nvidia":
        return ChatNVIDIA(
            model=model_name,
            api_key=api_key,
            **kwargs,
        )

    if provider == "OpenRouter":
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            **kwargs,
        )

    raise ValueError(f"Unsupported provider {provider}")



@app.get("/available_api_keys")
def get_available_api_keys():
    keys = {
        provider: os.getenv(env_var)
        for provider, env_var in PROVIDER_ENV_VARS.items()
    }
    keys = {k: v for k, v in keys.items() if v}
    if not keys:
        return JSONResponse(content={"detail": "No keys found."}, status_code=404)
    return keys


@app.on_event("startup")
def on_startup():
    # this will download/cache & move to GPU/CPU exactly once
    load_vectorstore()
    print("[FastAPI] Chromadb (chroma_uniprot_nomic) & embedder (nomic-ai/nomic-embed-text-v1) loaded on startup."
    )
    load_t5()
    print("[FastAPI] ProtT5 model loaded on startup.")
    bm25_initialize()
    print("[FastAPI] Documentes related to BM25 loaded on startup.")


class LLMRequest(BaseModel):
    model: str
    api_key: str
    verbose: bool
    limit: int
    retry_count: int
    question: str
    temperature: float | None = None 


class LLMResponse(BaseModel):
    solr_query: str
    results: dict
    logs: str | None = None


@app.post("/llm_query", response_model=LLMResponse)
def llm_query(req: LLMRequest):
    # clear previous logs
    log_stream.truncate(0)
    log_stream.seek(0)

    # load fields from SQLite + txt
    conn = sqlite3.connect(sqliteDb)
    cur = conn.cursor()
    cur.execute("SELECT * FROM search_fields")
    searchfields = cur.fetchall()
    with open("asset/queryfields.txt") as f:
        queryfields = f.read()
    cur.execute("SELECT * FROM result_fields")
    resultfields = cur.fetchall()
    conn.close()

    try:
        m = req.model
        llm = build_llm(m, req.api_key, req.temperature)

        if req.verbose:
            logger.info(f"Using model={m}, question={req.question}, limit={req.limit}, retries={req.retry_count}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # retry loop to generate Solr query + fetch
    solr_query = ""
    results = {"results": []}
    last_error = None
    for attempt in range(1, req.retry_count + 1):
        try:
            if req.verbose:
                logger.info(f"Attempt {attempt}: generating Solr query")
            solr_query = generate_solr_query(
                req.question, llm, searchfields, queryfields, resultfields
            )
            results = query_uniprot(solr_query, req.limit)
            last_error = None
            if results.get("results"):
                if req.verbose:
                    logger.info(f"Success on attempt {attempt}")
                break
            else:
                if req.verbose:
                    logger.warning(f"No results on attempt {attempt}")
        except Exception as e:
            last_error = e
            logger.error(f"Error on attempt {attempt}: {e}")
        time.sleep(3)

    if not results.get("results") and last_error is not None:
        raise HTTPException(
            status_code=502,
            detail=f"LLM query failed after {req.retry_count} attempts: {last_error}",
        )

    return LLMResponse(
        solr_query=solr_query,
        results=results,
        logs=(log_stream.getvalue() if req.verbose else None)
    )


class VectorRequest(BaseModel):
    sequence: str
    similarity_threshold: float = 0.8


class VectorResponse(BaseModel):
    embedding_time: float
    search_time: float
    found_embeddings: list[dict]
    go_enrichment: list[dict]


@app.post("/vector_search", response_model=VectorResponse)
def vector_search(req: VectorRequest):
    raw = req.sequence.strip()
    if raw.startswith(">"):
        seq = "".join(line for line in raw.splitlines() if not line.startswith(">"))
    else:
        seq = raw.replace("\n", "").strip()


    t0 = datetime.now()
    embDict, _ = getEmbeddings(
        seq_dict={"query_protein": seq},
        visualize=False,
        per_protein=True
    )
    embedding_time = (datetime.now() - t0).total_seconds()

    try:
        query_embedding = embDict["query_protein"]
    except KeyError:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding dict missing key 'query_protein'; got {list(embDict.keys())}"
        )

    # nearest neighbour search
    t1 = datetime.now()
    df = searchSpecificEmbedding(query_embedding, threshold=req.similarity_threshold)
    search_time = (datetime.now() - t1).total_seconds()

    df_final = df[df["Similarity"] >= 0.90]
    found = df.to_dict(orient="records")

    proteins = [rec["Protein ID"].strip("<>").split(">")[-1] for rec in found]
    go_df = findRelatedGoIds(proteins, dbPath=sqliteDb)
    go_records = go_df.to_dict(orient="records")

    return VectorResponse(
        embedding_time=embedding_time,
        search_time=search_time,
        found_embeddings=found,
        go_enrichment=go_records
    )


class RAGChatMessage(BaseModel):
    role: str
    content: str


class RAGRequest(BaseModel):
    model: str
    api_key: str
    question: str
    sequence: str
    top_k: int
    chat_history: List[RAGChatMessage] = Field(default_factory=list)
    temperature: float | None = None


class RAGResponse(BaseModel):
    answer: str
    protein_ids: List[str]
    suggested_followups: List[str]
    token_usage: dict | None = None


def summarize_token_usage_attempts(attempts):
    normalized_attempts = [attempt for attempt in attempts if isinstance(attempt, dict)]
    sources = {attempt.get("source") for attempt in normalized_attempts if attempt.get("source")}

    def attempt_total(attempt):
        total_tokens = attempt.get("total_tokens")
        if isinstance(total_tokens, int):
            return total_tokens

        input_tokens = attempt.get("input_tokens")
        output_tokens = attempt.get("output_tokens")
        if isinstance(input_tokens, int) and isinstance(output_tokens, int):
            return input_tokens + output_tokens

        return None

    input_tokens = sum(
        attempt.get("input_tokens", 0)
        for attempt in normalized_attempts
        if isinstance(attempt.get("input_tokens"), int)
    )
    output_tokens = sum(
        attempt.get("output_tokens", 0)
        for attempt in normalized_attempts
        if isinstance(attempt.get("output_tokens"), int)
    )
    total_tokens = sum(
        total
        for total in (attempt_total(attempt) for attempt in normalized_attempts)
        if isinstance(total, int)
    )
    successful_attempts = [
        attempt for attempt in normalized_attempts if attempt.get("status") == "success"
    ]
    successful_attempt = successful_attempts[-1] if successful_attempts else None

    if len(sources) > 1:
        source = "mixed"
    elif sources:
        source = next(iter(sources))
    else:
        source = "unavailable"

    return {
        "attempt_count": len(normalized_attempts),
        "successful_attempt": successful_attempt.get("attempt") if successful_attempt else None,
        "final_top_k": successful_attempt.get("top_k") if successful_attempt else None,
        "successful_retrieval_mode": successful_attempt.get("retrieval_mode") if successful_attempt else None,
        "failed_attempt_count": sum(
            1
            for attempt in normalized_attempts
            if attempt.get("status") != "success"
        ),
        "source": source,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "attempts": normalized_attempts,
    }


def safe_answer_with_proteins(llm, query, sequence, top_k, chat_history=None, max_attempts=6):
    attempt_records = []

    def record_attempt(attempt_usage, fallback_top_k, fallback_status, fallback_error=None):
        normalized = dict(attempt_usage or {})
        normalized["attempt"] = len(attempt_records) + 1
        normalized.setdefault("top_k", int(fallback_top_k))
        normalized.setdefault("status", fallback_status)
        if fallback_error and not normalized.get("error"):
            normalized["error"] = str(fallback_error)
        attempt_records.append(normalized)
        return normalized

    try:
        print(f"Trying top_k = {top_k}")
        answer, protein_ids, suggested_followups, attempt_usage = answerWithProteins(llm, query, sequence, top_k, chat_history)
        record_attempt(attempt_usage, top_k, "success")
        return answer, protein_ids, suggested_followups, summarize_token_usage_attempts(attempt_records)
    except RAGGenerationError as e:
        print(f"Initial top_k={top_k} failed: {e}")
        record_attempt(e.attempt_usage, top_k, "failed", e)
        last_error = e
    except Exception as e:
        print(f"Initial top_k={top_k} failed: {e}")
        record_attempt({}, top_k, "failed", e)
        last_error = e

    # if top_k failed, perform binary search for the largest valid k
    low = 1
    high = top_k - 1
    best_answer = None
    best_ids = []
    best_followups = []

    for _ in range(max_attempts):
        if low > high:
            break

        mid = (low + high) // 2
        print(f"Trying fallback top_k = {mid}")
        try:
            answer, protein_ids, suggested_followups, attempt_usage = answerWithProteins(llm, query, sequence, mid, chat_history)
            record_attempt(attempt_usage, mid, "success")
            best_answer = answer
            best_ids = protein_ids
            best_followups = suggested_followups
            low = mid + 1
        except RAGGenerationError as e:
            print(f"Error at top_k = {mid}: {e}")
            record_attempt(e.attempt_usage, mid, "failed", e)
            last_error = e
            high = mid - 1
        except Exception as e:
            print(f"Error at top_k = {mid}: {e}")
            record_attempt({}, mid, "failed", e)
            last_error = e
            high = mid - 1

    if best_answer is None:
        raise RuntimeError(f"Token limit error even at low top_k. Last error: {last_error}")

    return best_answer, best_ids, best_followups, summarize_token_usage_attempts(attempt_records)

@app.post("/rag_order", response_model=RAGResponse)
def rag_order(req: RAGRequest):
    try:
        m = req.model
        llm = build_llm(m, req.api_key, req.temperature, chat_mode=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model init error: {e}")

    try:
        chat_history = [
            message.model_dump() if hasattr(message, "model_dump") else message.dict()
            for message in req.chat_history
        ]
        answer, protein_ids, suggested_followups, token_usage = safe_answer_with_proteins(
            llm,
            req.question,
            req.sequence,
            req.top_k,
            chat_history,
        )
        if answer is None:
            answer = ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG generation failed: {e}")

    return RAGResponse(
        answer=answer,
        protein_ids=protein_ids,
        suggested_followups=suggested_followups or [],
        token_usage=token_usage,
    )

class RAGProteinListRequest(BaseModel):
    protein_ids: List[str]

class RAGProteinInfoResponse(BaseModel):
    found_info: list[dict]

@app.post("/rag_order/protein_info", response_model=RAGProteinInfoResponse)
def rag_order_with_protein_info(req: RAGProteinListRequest):
    protein_ids = req.protein_ids
    columns = ['Protein ID', 'Short Name', 'Protein Name', 'Organism', 'Taxon ID', 'Gene Name', 'pe', 'sv']
    results = pd.DataFrame(columns=columns)

    conn = sqlite3.connect(sqliteDb)

    for pid in protein_ids:
        infoDf = pd.read_sql_query(
            "SELECT protein_name, type, os, ox, gn, pe, sv FROM protein_info WHERE protein_id = ?", conn, params=(pid,)
        )

        if not infoDf.empty:
            row = {
                'Protein ID': pid,
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
            row['Protein ID'] = pid
        results.loc[len(results)] = row

    conn.close()

    return RAGProteinInfoResponse(found_info=results.to_dict(orient="records"))
