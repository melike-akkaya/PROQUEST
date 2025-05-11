from langchain import PromptTemplate, LLMChain
from src.proteinRetriverFromFlatFiles import retrieveRelatedProteins
from src.proteinRetriverFromSequences import retrieveRelatedProteinsFromSequences


def retriveProteins(llm, query, sequence, top_k) :
    if (sequence == ''):
        documents = retrieveRelatedProteins(query, top_k)
    else:
        documents = retrieveRelatedProteinsFromSequences(sequence, top_k)

    prompt = PromptTemplate(    
        template="""
You are a document-ranking assistant.  
Given a user question and a list of retrieved documents (each with a File ID and Content), do the following:

1. Assess relevance of each document to the question.
2. Rank the relevant documents from most to least relevant.
3. Output only the Protein IDs of the relevant documents, in descending order of relevance, as a comma-separated list.
4. Exclude any document that is not relevant.
5. Return at most half of the given data.

For example, if the proteins have IDs [Q6GZX4, Q6GZX3, Q197F8, Q197F7] and files Q6GZX4 and Q197F8 are irrelevant to the question, and file Q197F7 is more relevant than Q6GZX3, you would return:

'Q197F7','Q6GZX3'

Important Note : You should NOT return ANY additional information. You should only return the ids as given in the example.
---
Question:
{query}

Documents:
{documents}
    """
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    orderedFileIds = chain.run(query=query, documents=documents)
    return orderedFileIds