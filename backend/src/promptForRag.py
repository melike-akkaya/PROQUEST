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

> IMPORTANT: When the question mentions terms such as “the given protein,” “the protein below,” “the provided embedding,” or similar phrases, interpret those as referring to the input sequence used to retrieve the following documents.

Your task is to:
1. Read the user’s **Question** carefully.
2. Generate a clear, concise, and accurate answer **using only the content from the provided documents**.
3. When referencing information from the documents, cite the relevant **Protein ID** in this format: **[Protein ID]**.
4. If there is not enough information in the documents to answer the question, respond with:  
   **“I don’t have enough information to answer that based on the provided records.”**

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
