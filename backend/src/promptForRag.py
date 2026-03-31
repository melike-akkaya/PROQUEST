import json

from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import LLMChain
from src.proteinRetriverFromFlatFiles import retrieveRelatedProteins
from src.proteinRetriverFromBM25 import retrieveRelatedProteinsFromBM25
from src.proteinRetriverFromSequences import retrieveRelatedProteinsFromSequences
from src.proteinRetriverFromFTS import retrieveRelatedProteinsFTS
import pandas as pd


FOLLOW_UPS_MARKER = "SUGGESTED_FOLLOWUPS_JSON:"
MAX_CONTEXT_TURNS = 3


def format_documents(df):
    return "\n\n".join(
        f"Protein ID: {row['Protein ID']}\nContent: {row['Content']}"
        for _, row in df.iterrows()
    )


def build_conversation_context(chat_history):
    history = []

    for message in chat_history or []:
        if not isinstance(message, dict):
            continue
        if message.get("includeInContext") is False:
            continue

        role = str(message.get("role") or "").strip().lower()
        content = str(message.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue

        role_label = "User" if role == "user" else "Assistant"
        history.append(f"{role_label}: {content}")

    history = history[-MAX_CONTEXT_TURNS:]

    if not history:
        return ""

    return "\n".join([
        "Background context from earlier turns (optional):",
        "It is much less important than the latest request and may be ignored.",
        *history,
        "",
    ]).strip()


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
        overlapCount = sum(1 for v in scoreParts.values() if v > 0)
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
    conversation_context = build_conversation_context(chat_history)
    conversation_block = ""
    if conversation_context:
        conversation_block = (
            "**Background Context From Earlier Turns (optional):**\n"
            f"{conversation_context}\n\n"
            "---\n"
        )

    if sequence == '':
        documents_df = hybridRetrieveRelatedProteins(cleaned_query, top_k)
        formatted_documents = format_documents(documents_df)

        prompt = PromptTemplate(
            template="""
You are a domain-aware assistant with access to a collection of protein-related documents. Each document includes a **Protein ID** and associated **Content**.

Your task is to:
0. First decide whether the user's question is unrelated to proteins, genes, sequences, UniProt entries, annotations, pathways, domains, motifs, organisms, or molecular biology / biochemistry concepts relevant to proteins.
   If it is unrelated, return exactly this sentence and nothing else:
   "This assistant only answers protein-, sequence-, and UniProt-related questions."
1. Carefully read the user’s **Question**.
2. Formulate a clear and concise answer **using only the content from the provided documents**.
3. When referencing specific information, include a citation in the format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond using your internal knowledge and add a warning:  
   **“I don’t have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:”**

Style:
- **Start your answer directly with the key information.**  
  Do NOT use meta-introductions such as “To address your question…”,  
  “Based on the provided documents…”, or similar phrases.
- Use clear, concise scientific language.
- If you need to show your reasoning, weave it briefly into the answer itself, without long preambles.
- If background context from earlier turns is provided, treat it as much less important than the current question and the retrieved protein documents.
- Use earlier-turn context only when it clearly helps interpret the latest request; otherwise ignore it.
- After your answer, add one final line exactly in this format:
  SUGGESTED_FOLLOWUPS_JSON: ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
- Make the follow-up questions specific and relevant to the current answer, using only the retrieved protein documents shown above.
- Do not suggest any follow-up that requires external facts or internal knowledge beyond those documents.
- Do not use code fences.

---
{conversation_block}**Question:**  
{query}

**Protein Documents:**  
{documents}

---
**Your Answer:**
"""
        )

    else:
        documents_df = retrieveRelatedProteinsFromSequences(sequence, top_k)
        formatted_documents = format_documents(documents_df)

        prompt = PromptTemplate(
            template="""
You are a domain-aware assistant with access to a collection of protein-related documents. Each document contains a **Protein ID** and its associated **Content**.

The user has provided a **specific protein sequence**, and the following documents were retrieved based on their similarity to that sequence.

IMPORTANT: The user’s protein sequence has already been used to retrieve these documents via sequence-similarity search. You do not need to re-process the sequence—every document here is already relevant. If the question mentions phrases like “given sequence,” “below sequence,” or “given protein,” treat them as references to this pre-processed input and rely solely on the provided documents for your answer.

Your task is to:
0. First decide whether the user's question is unrelated to proteins, genes, sequences, UniProt entries, annotations, pathways, domains, motifs, organisms, or molecular biology / biochemistry concepts relevant to proteins.
   If it is unrelated, return exactly this sentence and nothing else:
   "This assistant only answers protein-, sequence-, and UniProt-related questions."
1. Read the user’s **Question** carefully.
2. Generate a clear, concise, and accurate answer **using only the content from the provided documents**.
3. When referencing information from the documents, cite the relevant **Protein ID** in this format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond using your internal knowledge and add a warning:  
   **“I don’t have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:”**

Style:
- **Start your answer directly with the key information.**  
  Do NOT use meta-introductions such as “To address your question…”,  
  “Based on the following sequence…”, or similar phrases.
- Use clear, concise scientific language.
- If you need to show your reasoning, weave it briefly into the answer itself, without long preambles.
- If background context from earlier turns is provided, treat it as much less important than the current question and the retrieved protein documents.
- Use earlier-turn context only when it clearly helps interpret the latest request; otherwise ignore it.
- After your answer, add one final line exactly in this format:
  SUGGESTED_FOLLOWUPS_JSON: ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
- Make the follow-up questions specific and relevant to the current answer, using only the retrieved protein documents shown above.
- Do not suggest any follow-up that requires external facts or internal knowledge beyond those documents.
- Do not use code fences.

---
{conversation_block}**Question:**  
{query}

**Protein Documents (retrieved based on similarity to the input protein sequence):**  
{documents}

---
**Your Answer:**
"""
        )

    chain = LLMChain(llm=llm, prompt=prompt)
    raw_output = chain.run(
        query=cleaned_query,
        documents=formatted_documents,
        conversation_block=conversation_block,
    )
    answer, suggested_followups = extract_answer_and_followups(raw_output)

    protein_ids = documents_df["Protein ID"].tolist()
    return answer, protein_ids, suggested_followups
