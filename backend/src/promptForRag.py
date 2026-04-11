import json
from typing import Any

import pandas as pd
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from src.proteinRetriverFromBM25 import retrieveRelatedProteinsFromBM25
from src.proteinRetriverFromFTS import retrieveRelatedProteinsFTS
from src.proteinRetriverFromFlatFiles import retrieveRelatedProteins
from src.proteinRetriverFromSequences import retrieveRelatedProteinsFromSequences


FOLLOW_UPS_MARKER = "SUGGESTED_FOLLOWUPS_JSON:"
MAX_CONTEXT_TURNS = 3

HYBRID_RAG_SYSTEM_PROMPT = """
You are a domain-aware assistant with access to a collection of protein-related documents. Each document includes a **Protein ID** and associated **Content**.

Your task is to:
0. First decide whether the user's question is unrelated to proteins, genes, sequences, UniProt entries, annotations, pathways, domains, motifs, organisms, or molecular biology / biochemistry concepts relevant to proteins.
   If it is unrelated, return exactly this sentence and nothing else:
   "This assistant only answers protein-, sequence-, and UniProt-related questions."
1. Carefully read the user's **Question**.
2. Formulate a clear and concise answer **using only the content from the provided documents**.
3. When referencing specific information, include a citation in the format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond using your internal knowledge and add a warning:
   **"I don't have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:"**

Style:
- **Start your answer directly with the key information.**
  Do NOT use meta-introductions such as "To address your question...",
  "Based on the provided documents...", or similar phrases.
- Use clear, concise scientific language.
- If you need to show your reasoning, weave it briefly into the answer itself, without long preambles.
- Treat earlier chat turns as supporting context only.
- Always prioritize the latest user message and the retrieved protein documents over earlier turns.
- After your answer, add one final line exactly in this format:
  SUGGESTED_FOLLOWUPS_JSON: ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
- Make the follow-up questions specific and relevant to the current answer, using only the retrieved protein documents shown above.
- Do not suggest any follow-up that requires external facts or internal knowledge beyond those documents.
- Do not use code fences.
""".strip()

SEQUENCE_RAG_SYSTEM_PROMPT = """
You are a domain-aware assistant with access to a collection of protein-related documents. Each document contains a **Protein ID** and its associated **Content**.

The user has provided a **specific protein sequence**, and the following documents were retrieved based on their similarity to that sequence.

IMPORTANT: The user's protein sequence has already been used to retrieve these documents via sequence-similarity search. You do not need to re-process the sequence: every document here is already relevant. If the question mentions phrases like "given sequence," "below sequence," or "given protein," treat them as references to this pre-processed input and rely solely on the provided documents for your answer.

Your task is to:
0. First decide whether the user's question is unrelated to proteins, genes, sequences, UniProt entries, annotations, pathways, domains, motifs, organisms, or molecular biology / biochemistry concepts relevant to proteins.
   If it is unrelated, return exactly this sentence and nothing else:
   "This assistant only answers protein-, sequence-, and UniProt-related questions."
1. Read the user's **Question** carefully.
2. Generate a clear, concise, and accurate answer **using only the content from the provided documents**.
3. When referencing information from the documents, cite the relevant **Protein ID** in this format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond using your internal knowledge and add a warning:
   **"I don't have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:"**

Style:
- **Start your answer directly with the key information.**
  Do NOT use meta-introductions such as "To address your question...",
  "Based on the following sequence...", or similar phrases.
- Use clear, concise scientific language.
- If you need to show your reasoning, weave it briefly into the answer itself, without long preambles.
- Treat earlier chat turns as supporting context only.
- Always prioritize the latest user message and the retrieved protein documents over earlier turns.
- After your answer, add one final line exactly in this format:
  SUGGESTED_FOLLOWUPS_JSON: ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
- Make the follow-up questions specific and relevant to the current answer, using only the retrieved protein documents shown above.
- Do not suggest any follow-up that requires external facts or internal knowledge beyond those documents.
- Do not use code fences.
""".strip()

HYBRID_RAG_HUMAN_PROMPT = """
**Question:**
{query}

**Protein Documents:**
{documents}

---
**Your Answer:**
""".strip()

SEQUENCE_RAG_HUMAN_PROMPT = """
**Question:**
{query}

**Protein Documents (retrieved based on similarity to the input protein sequence):**
{documents}

---
**Your Answer:**
""".strip()


class RAGGenerationError(Exception):
    def __init__(self, message, attempt_usage=None):
        super().__init__(message)
        self.attempt_usage = attempt_usage or {}


def format_documents(df):
    return "\n\n".join(
        f"Protein ID: {row['Protein ID']}\nContent: {row['Content']}"
        for _, row in df.iterrows()
    )


def format_document_fragment(protein_id, content):
    return f"Protein ID: {protein_id}\nContent: {content}"


def build_document_payload(df, llm):
    document_details = []
    formatted_fragments = []

    for rank, (_, row) in enumerate(df.iterrows(), start=1):
        protein_id = str(row.get("Protein ID") or "").strip()
        content = str(row.get("Content") or "")
        fragment = format_document_fragment(protein_id, content)
        formatted_fragments.append(fragment)

        line_count = content.count("\n") + 1 if content else 0
        document_details.append(
            {
                "rank": rank,
                "protein_id": protein_id,
                "uniprot_url": f"https://www.uniprot.org/uniprotkb/{protein_id}" if protein_id else None,
                "content_char_count": len(content),
                "content_line_count": line_count,
                "content_tokens_estimate": safe_count_text_tokens(llm, content),
                "prompt_fragment_tokens_estimate": safe_count_text_tokens(llm, fragment),
            }
        )

    return "\n\n".join(formatted_fragments), document_details


def build_history_messages(chat_history):
    if MAX_CONTEXT_TURNS <= 0:
        return []

    history = []
    user_turns = 0

    for message in reversed(chat_history or []):
        if not isinstance(message, dict):
            continue

        role = str(message.get("role") or "").strip().lower()
        content = str(message.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue

        history.append(
            HumanMessage(content=content)
            if role == "user"
            else AIMessage(content=content)
        )

        if role == "user":
            user_turns += 1
            if user_turns >= MAX_CONTEXT_TURNS:
                break

    return list(reversed(history))


def coerce_text_content(content: Any) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
            else:
                parts.append(str(item))
        return "\n".join(part for part in parts if part).strip()

    if isinstance(content, dict):
        text = content.get("text")
        return text if isinstance(text, str) else json.dumps(content)

    return "" if content is None else str(content)


def recursive_dict_candidates(value: Any):
    if isinstance(value, dict):
        yield value
        for nested in value.values():
            yield from recursive_dict_candidates(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from recursive_dict_candidates(nested)


def coerce_int(value: Any):
    if value is None or isinstance(value, bool):
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    if isinstance(value, str):
        text = value.strip()
        if text.isdigit():
            return int(text)

    return None


def first_token_value(candidates, keys):
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue

        for key in keys:
            value = coerce_int(candidate.get(key))
            if value is not None:
                return value

    return None


def extract_token_usage(response):
    usage_candidates = []

    usage_metadata = getattr(response, "usage_metadata", None)
    response_metadata = getattr(response, "response_metadata", None)

    for candidate in [usage_metadata, response_metadata]:
        usage_candidates.extend(recursive_dict_candidates(candidate))

    input_tokens = first_token_value(usage_candidates, ("input_tokens", "prompt_tokens"))
    output_tokens = first_token_value(usage_candidates, ("output_tokens", "completion_tokens"))
    total_tokens = first_token_value(usage_candidates, ("total_tokens",))

    if total_tokens is None and input_tokens is not None and output_tokens is not None:
        total_tokens = input_tokens + output_tokens

    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }


def safe_count_text_tokens(llm, text):
    normalized = str(text or "")
    if not normalized:
        return 0

    token_counter = getattr(llm, "get_num_tokens", None)
    if callable(token_counter):
        try:
            count = token_counter(normalized)
            return int(count) if count is not None else None
        except Exception:
            return None

    return None


def safe_count_message_tokens(llm, messages):
    if not messages:
        return 0

    message_counter = getattr(llm, "get_num_tokens_from_messages", None)
    if callable(message_counter):
        try:
            count = message_counter(messages)
            return int(count) if count is not None else None
        except Exception:
            pass

    counts = []
    for message in messages:
        content_tokens = safe_count_text_tokens(llm, getattr(message, "content", ""))
        if content_tokens is None:
            return None
        counts.append(content_tokens)

    return sum(counts)


def build_prompt_breakdown(llm, system_prompt_text, query, formatted_documents, history_messages, prompt_messages, raw_output):
    system_tokens = safe_count_text_tokens(llm, system_prompt_text)
    question_tokens = safe_count_text_tokens(llm, query)
    documents_tokens = safe_count_text_tokens(llm, formatted_documents)
    history_tokens = safe_count_message_tokens(llm, history_messages)
    prompt_tokens = safe_count_message_tokens(llm, prompt_messages)
    output_tokens = safe_count_text_tokens(llm, raw_output)

    template_overhead = None
    component_tokens = [system_tokens, question_tokens, documents_tokens, history_tokens]
    if prompt_tokens is not None and all(token is not None for token in component_tokens):
        template_overhead = max(prompt_tokens - sum(component_tokens), 0)

    return {
        "system_tokens_estimate": system_tokens,
        "chat_history_tokens_estimate": history_tokens,
        "question_tokens_estimate": question_tokens,
        "documents_tokens_estimate": documents_tokens,
        "template_overhead_tokens_estimate": template_overhead,
        "prompt_tokens_estimate": prompt_tokens,
        "output_tokens_estimate": output_tokens,
    }


def build_attempt_usage(
    llm,
    top_k,
    retrieval_mode,
    retrieved_document_count,
    document_details,
    system_prompt_text,
    query,
    formatted_documents,
    history_messages,
    prompt_messages,
    raw_output,
    response=None,
    status="success",
    error=None,
):
    prompt_breakdown = build_prompt_breakdown(
        llm=llm,
        system_prompt_text=system_prompt_text,
        query=query,
        formatted_documents=formatted_documents,
        history_messages=history_messages,
        prompt_messages=prompt_messages,
        raw_output=raw_output,
    )
    provider_usage = extract_token_usage(response) if response is not None else {
        "input_tokens": None,
        "output_tokens": None,
        "total_tokens": None,
    }

    input_tokens = provider_usage["input_tokens"]
    output_tokens = provider_usage["output_tokens"]
    total_tokens = provider_usage["total_tokens"]
    source = "provider_reported"

    if input_tokens is None:
        input_tokens = prompt_breakdown["prompt_tokens_estimate"]
        source = "estimate"

    if output_tokens is None:
        output_tokens = prompt_breakdown["output_tokens_estimate"]
        source = "estimate"

    if total_tokens is None and input_tokens is not None and output_tokens is not None:
        total_tokens = input_tokens + output_tokens

    return {
        "top_k": int(top_k),
        "status": status,
        "retrieval_mode": retrieval_mode,
        "retrieved_document_count": int(retrieved_document_count),
        "history_message_count": len(history_messages or []),
        "source": source,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "provider_usage": provider_usage,
        "prompt_breakdown": prompt_breakdown,
        "documents": document_details,
        "error": error,
    }


def hybridRetrieveRelatedProteins(query, top_k):
    vectordbDocs = retrieveRelatedProteins(query, top_k)
    bm25Docs = retrieveRelatedProteinsFromBM25(query, top_k)
    ftsDocs = retrieveRelatedProteinsFTS(query, top_k)

    weights = {
        "vector": 0.5,
        "bm25": 0.3,
        "fts": 0.2
    }

    def score_df(df, method_name):
        scoreMap = {}
        for rank, row in df.iterrows():
            pid = row["Protein ID"]
            score = 1.0 - (rank / top_k)  # higher rank -> higher score
            scoreMap[pid] = {
                "content": row["Content"],
                method_name: score
            }
        return scoreMap

    vectorScores = score_df(vectordbDocs, "vector")
    bm25Scores = score_df(bm25Docs, "bm25")
    ftsScores = score_df(ftsDocs, "fts")

    allPids = set(vectorScores) | set(bm25Scores) | set(ftsScores)
    combinedResults = {}

    for pid in allPids:
        scoreParts = {
            "vector": vectorScores.get(pid, {}).get("vector", 0),
            "bm25": bm25Scores.get(pid, {}).get("bm25", 0),
            "fts": ftsScores.get(pid, {}).get("fts", 0)
        }
        baseScore = (
            weights["vector"] * scoreParts["vector"] +
            weights["bm25"] * scoreParts["bm25"] +
            weights["fts"] * scoreParts["fts"]
        )
        overlapCount = sum(1 for value in scoreParts.values() if value > 0)
        overlapBoost = 1 + 0.15 * (overlapCount - 1)  # 0.15 boost per extra source
        boostedScore = baseScore * overlapBoost

        content = (vectorScores.get(pid, {}).get("content") or
                   bm25Scores.get(pid, {}).get("content") or
                   ftsScores.get(pid, {}).get("content"))

        combinedResults[pid] = {
            "Protein ID": pid,
            "Content": content,
            "Score": boostedScore
        }

    df = pd.DataFrame(combinedResults.values())
    df = df.sort_values(by="Score", ascending=False).drop(columns=["Score"])
    return df.head(top_k).reset_index(drop=True)


def extract_answer_and_followups(raw_output):
    text = (raw_output or "").strip()
    marker_index = text.rfind(FOLLOW_UPS_MARKER)

    if marker_index == -1:
        return text, []

    answer = text[:marker_index].rstrip()
    followups_raw = text[marker_index + len(FOLLOW_UPS_MARKER):].strip()

    try:
        parsed = json.loads(followups_raw)
    except json.JSONDecodeError:
        return text, []

    if not isinstance(parsed, list):
        return text, []

    suggestions = []
    for item in parsed:
        candidate = str(item).strip()
        if candidate and candidate not in suggestions:
            suggestions.append(candidate)

    return answer, suggestions[:4]


def answerWithProteins(llm, query, sequence, top_k, chat_history=None):
    cleaned_query = (query or "").strip()
    history_messages = build_history_messages(chat_history)
    retrieval_mode = "hybrid" if sequence == '' else "sequence"
    system_prompt_text = HYBRID_RAG_SYSTEM_PROMPT if sequence == '' else SEQUENCE_RAG_SYSTEM_PROMPT
    human_prompt_text = HYBRID_RAG_HUMAN_PROMPT if sequence == '' else SEQUENCE_RAG_HUMAN_PROMPT
    documents_df = pd.DataFrame(columns=["Protein ID", "Content"])
    formatted_documents = ""
    document_details = []
    prompt_messages = []

    try:
        if sequence == '':
            documents_df = hybridRetrieveRelatedProteins(cleaned_query, top_k)
        else:
            documents_df = retrieveRelatedProteinsFromSequences(sequence, top_k)

        formatted_documents, document_details = build_document_payload(documents_df, llm)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt_text),
                MessagesPlaceholder("chat_history"),
                ("human", human_prompt_text),
            ]
        )
        prompt_messages = prompt.format_messages(
            query=cleaned_query,
            documents=formatted_documents,
            chat_history=history_messages,
        )
    except Exception as exc:
        attempt_usage = build_attempt_usage(
            llm=llm,
            top_k=top_k,
            retrieval_mode=retrieval_mode,
            retrieved_document_count=len(documents_df.index),
            document_details=document_details,
            system_prompt_text=system_prompt_text,
            query=cleaned_query,
            formatted_documents=formatted_documents,
            history_messages=history_messages,
            prompt_messages=prompt_messages,
            raw_output="",
            status="failed",
            error=str(exc),
        )
        raise RAGGenerationError(str(exc), attempt_usage=attempt_usage) from exc

    try:
        response = llm.invoke(prompt_messages)
    except Exception as exc:
        attempt_usage = build_attempt_usage(
            llm=llm,
            top_k=top_k,
            retrieval_mode=retrieval_mode,
            retrieved_document_count=len(documents_df.index),
            document_details=document_details,
            system_prompt_text=system_prompt_text,
            query=cleaned_query,
            formatted_documents=formatted_documents,
            history_messages=history_messages,
            prompt_messages=prompt_messages,
            raw_output="",
            status="failed",
            error=str(exc),
        )
        raise RAGGenerationError(str(exc), attempt_usage=attempt_usage) from exc

    raw_output = coerce_text_content(getattr(response, "content", ""))
    answer, suggested_followups = extract_answer_and_followups(raw_output)
    protein_ids = documents_df["Protein ID"].tolist()
    attempt_usage = build_attempt_usage(
        llm=llm,
        top_k=top_k,
        retrieval_mode=retrieval_mode,
        retrieved_document_count=len(documents_df.index),
        document_details=document_details,
        system_prompt_text=system_prompt_text,
        query=cleaned_query,
        formatted_documents=formatted_documents,
        history_messages=history_messages,
        prompt_messages=prompt_messages,
        raw_output=raw_output,
        response=response,
        status="success",
    )

    return answer, protein_ids, suggested_followups, attempt_usage
