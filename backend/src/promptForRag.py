from langchain import PromptTemplate, LLMChain
from src.proteinRetriverFromFlatFiles import retrieveRelatedProteins
from src.proteinRetriverFromBM25 import retrieveRelatedProteinsFromBM25
from src.proteinRetriverFromSequences import retrieveRelatedProteinsFromSequences
import pandas as pd

def answerWithProteins(llm, query, sequence, top_k):
    if sequence == '':
        half_top_k = top_k // 2
        docs1 = retrieveRelatedProteins(query, half_top_k)
        docs2 = retrieveRelatedProteinsFromBM25(query, half_top_k)
        documents = pd.concat([docs1, docs2], ignore_index=True)
    

        prompt = PromptTemplate(
            template="""
You are a domain-aware assistant with access to a collection of protein-related documents. Each document includes a **Protein ID** and associated **Content**.

Your task is to:
1. Carefully read the user’s **Question**.
2. Formulate a clear and concise answer **using only the content from the provided documents**.
3. When referencing specific information, include a citation in the format: **[Protein ID]**.
4. If the documents do not contain sufficient information to answer the question, respond with:  
   **“I don’t have enough information to answer that based on the provided records.”**

Style & Reasoning:
Use clear, concise language.
Weave in your reasoning explicitly with phrases like “Let me check if…,” “Another thing to note is…,” or “I should verify whether….”
Do not introduce facts or assumptions beyond what’s in the documents.

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
        documents = retrieveRelatedProteinsFromSequences(sequence, top_k)
        prompt = PromptTemplate(
            template="""
You are a domain-aware assistant with access to a collection of protein-related documents. Each document contains a **Protein ID** and its associated **Content**.

The user has provided a **specific protein sequence**, and the following documents were retrieved based on their similarity to that sequence.

IMPORTANT: The user’s protein sequence has already been used to retrieve these documents via sequence‐similarity search. You do not need to re‐process the sequence—every document here is already relevant. If the question mentions phrases like “given sequence,” “below sequence,” or “given protein,” treat them as references to this pre‐processed input and rely solely on the provided documents for your answer.

Your task is to:
1. Read the user’s **Question** carefully.
2. Generate a clear, concise, and accurate answer **using only the content from the provided documents**.
3. When referencing information from the documents, cite the relevant **Protein ID** in this format: **[Protein ID]**.
4. If there is not enough information in the documents to answer the question, respond with:  
   **“I don’t have enough information to answer that based on the provided records.”**

Style & Reasoning:
Use clear, concise language.
Weave in your reasoning explicitly with phrases like “Let me check if…,” “Another thing to note is…,” or “I should verify whether….”
Do not introduce facts or assumptions beyond what’s in the documents.

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
    answer = chain.run(query=query, documents=documents)

    protein_ids = documents["Protein ID"].tolist()
    return answer, protein_ids
