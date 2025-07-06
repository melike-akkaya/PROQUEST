from langchain import PromptTemplate, LLMChain
from src.proteinRetriverFromFlatFiles import retrieveRelatedProteins
from src.proteinRetriverFromBM25 import retrieveRelatedProteinsFromBM25
from src.proteinRetriverFromSequences import retrieveRelatedProteinsFromSequences
from src.proteinRetriverFromFTS import retrieveRelatedProteinsFTS
import pandas as pd

def format_documents(df):
    return "\n\n".join(
        f"Protein ID: {row['Protein ID']}\nContent: {row['Content']}"
        for _, row in df.iterrows()
    )

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


def answerWithProteins(llm, query, sequence, top_k):
    if sequence == '':
        documents_df = hybridRetrieveRelatedProteins(query, top_k)
        formatted_documents = format_documents(documents_df)

        prompt = PromptTemplate(
            template="""
You are a domain-aware assistant with access to a collection of protein-related documents. Each document includes a **Protein ID** and associated **Content**.

Your task is to:
1. Carefully read the user’s **Question**.
2. Formulate a clear and concise answer **using only the content from the provided documents**.
3. When referencing specific information, include a citation in the format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond your internal knowledge and add a warning:  
   **“I don’t have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:”**

Style & Reasoning:
Use clear, concise language.
Weave in your reasoning explicitly with phrases like “Let me check if…,” “Another thing to note is…,” or “I should verify whether….”

---
**Question:**  
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

IMPORTANT: The user’s protein sequence has already been used to retrieve these documents via sequence‐similarity search. You do not need to re‐process the sequence—every document here is already relevant. If the question mentions phrases like “given sequence,” “below sequence,” or “given protein,” treat them as references to this pre‐processed input and rely solely on the provided documents for your answer.

Your task is to:
1. Read the user’s **Question** carefully.
2. Generate a clear, concise, and accurate answer **using only the content from the provided documents**.
3. When referencing information from the documents, cite the relevant **Protein ID** in this format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond your internal knowledge and add a warning:  
   **“I don’t have enough information to answer this question based on the flat files. But here is an answer using my internal knowledge:”**

Style & Reasoning:
Use clear, concise language.
Weave in your reasoning explicitly with phrases like “Let me check if…,” “Another thing to note is…,” or “I should verify whether….”

---
**Question:**  
{query}

**Protein Documents (retrieved based on similarity to the input protein sequence):**  
{documents}

---
**Your Answer:**
"""
        )

    chain = LLMChain(llm=llm, prompt=prompt)
    answer = chain.run(query=query, documents=formatted_documents)

    protein_ids = documents_df["Protein ID"].tolist()
    return answer, protein_ids
