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
    else:
        documents = retrieveRelatedProteinsFromSequences(sequence, top_k)

    prompt = PromptTemplate(
        template="""
You are a knowledgeable assistant with access to a set of protein documents.
Each document consists of a File ID and its Content.

Your task is to:
1. Read the user’s question.
2. Use **only** the information contained in the provided documents to compose a clear, concise answer.
3. Wherever you draw on a specific document, include a citation in the form [File ID].
4. If the documents are insufficient to answer fully, say “I don’t have enough information to answer that based on the provided records.”
5. Do not mention any documents that you did not use.

---  
Question:
{query}

Protein Documents:
{documents}

Your answer:
"""
    )

    chain = LLMChain(llm=llm, prompt=prompt)
    answer = chain.run(query=query, documents=documents)

    protein_ids = documents["Protein ID"].tolist()
    return answer, protein_ids
