from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import logging, io, time, sqlite3
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_mistralai.chat_models import ChatMistralAI
from src.prompt import query_uniprot, generate_solr_query
from src.promptForRag import retriveProteins
from src.prott5Embedder import getEmbeddings
from src.relevantGOIdFinder import findRelatedGoIds
from src.relevantProteinFinder import searchSpecificEmbedding

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

sqliteDb = "asset/protein_index.db"

# set up in‑memory log capture
log_stream = io.StringIO()
logging.basicConfig(stream=log_stream, level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("backend")


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

        kwargs = {}  
        if req.temperature is not None:
            kwargs["temperature"] = req.temperature

        if m.startswith("gemini"):
            llm = GoogleGenerativeAI(model=m, google_api_key=req.api_key, **kwargs)
        elif m in ("gpt-4o", "gpt-4o-mini", "o3-mini"):
            llm = ChatOpenAI(model=m, api_key=req.api_key, **kwargs)
        elif m.startswith("claude"):
            llm = ChatAnthropic(model=m, anthropic_api_key=req.api_key, **kwargs)
        elif m.startswith("meta/llama"):
            llm = ChatNVIDIA(model=m, api_key=req.api_key, **kwargs)
        elif m.startswith("deepseek"):
            llm = ChatOpenAI(model=m, api_key=req.api_key,
                             base_url="https://openrouter.ai/api/v1", **kwargs)
        elif m in ("mistral-small", "codestral-latest"):
            llm = ChatMistralAI(model=m, api_key=req.api_key, **kwargs)
        else:
            raise ValueError(f"Unsupported model {m}")

        if req.verbose:
            logger.info(f"Using model={m}, question={req.question}, limit={req.limit}, retries={req.retry_count}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # retry loop to generate Solr query + fetch
    solr_query = ""
    results = {"results": []}
    for attempt in range(1, req.retry_count + 1):
        try:
            if req.verbose:
                logger.info(f"Attempt {attempt}: generating Solr query")
            solr_query = generate_solr_query(
                req.question, llm, searchfields, queryfields, resultfields
            )
            results = query_uniprot(solr_query, req.limit)
            if results.get("results"):
                if req.verbose:
                    logger.info(f"Success on attempt {attempt}")
                break
            else:
                if req.verbose:
                    logger.warning(f"No results on attempt {attempt}")
        except Exception as e:
            logger.error(f"Error on attempt {attempt}: {e}")
        time.sleep(3)

    return LLMResponse(
        solr_query=solr_query,
        results=results,
        logs=(log_stream.getvalue() if req.verbose else None)
    )


class VectorRequest(BaseModel):
    sequence: str


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
        visualize=True,
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
    df = searchSpecificEmbedding(query_embedding) # list proteins with similarity up to 0.8
    search_time = (datetime.now() - t1).total_seconds()

    # list proteins with similarity up to 0.9
    df_final = df[df["Similarity"] >= 0.90]
    found = df_final.to_dict(orient="records")

    proteins = [
        rec["Protein ID"].strip("<>").split(">")[-1]
        for rec in found
    ]
    go_df = findRelatedGoIds(proteins, dbPath=sqliteDb)
    go_records = go_df.to_dict(orient="records")

    return VectorResponse(
        embedding_time=embedding_time,
        search_time=search_time,
        found_embeddings=found,
        go_enrichment=go_records
    )

class RAGRequest(BaseModel):
    model: str
    api_key: str
    question: str
    sequence: str
    top_k: int
    temperature: float | None = None

class RAGResponse(BaseModel):
    protein_ids: str


@app.post("/rag_order", response_model=RAGResponse)
def rag_order(req: RAGRequest):
    try:
        m = req.model
        kwargs = {}
        if req.temperature is not None:
            kwargs["temperature"] = req.temperature

        if m.startswith("gemini"):
            llm = GoogleGenerativeAI(model=m, google_api_key=req.api_key, **kwargs)
        elif m in ("gpt-4o", "gpt-4o-mini", "o3-mini"):
            llm = ChatOpenAI(model=m, api_key=req.api_key, **kwargs)
        elif m.startswith("claude"):
            llm = ChatAnthropic(model=m, anthropic_api_key=req.api_key, **kwargs)
        elif m.startswith("meta/llama"):
            llm = ChatNVIDIA(model=m, api_key=req.api_key, **kwargs)
        elif m.startswith("deepseek"):
            llm = ChatOpenAI(
                model=m,
                api_key=req.api_key,
                base_url="https://openrouter.ai/api/v1",
                **kwargs
            )
        elif m in ("mistral-small", "codestral-latest"):
            llm = ChatMistralAI(model=m, api_key=req.api_key, **kwargs)
        else:
            raise ValueError(f"Unsupported model {m}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model init error: {e}")

    try:
        proteinIds = retriveProteins(llm, req.question, req.sequence, req.top_k)
        if proteinIds is None:
            proteinIds = ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG ranking error: {e}")

    return RAGResponse(protein_ids=proteinIds)
