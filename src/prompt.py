from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import requests

def generate_solr_query(question, llm, searchFields, resultFields):
    """
    Generate a Solr query for the UniProt database from a natural language query.

    Args:
        question (str): The natural language question to convert.
        llm (object): The language model to use for generating the query.

    Returns:
        str: The generated Solr query.
    """
    prompt = PromptTemplate(
        input_variables=["question", "searchfields", "resultfields"],
        template="""Task: Generate a Solr query for the UniProt database from a natural language query.
Instructions:
- Use only the provided search fields and their corresponding terms from the UniProt database.
- Ensure the syntax of the generated Solr query is correct and compatible with UniProt's search system.
- Use the appropriate search field prefixes and syntax as specified in the UniProt documentation.
Search Fields:
{searchfields}
Result Fields:
{resultfields}
The question is: {question}
Generate a Solr query for the UniProt database based on this natural language query."""
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    solr_query = chain.run(question=question, searchfields=searchFields, resultfields=resultFields)
    return solr_query.strip()

def query_uniprot(solr_query, limit):
    """
    Query the UniProt database using a Solr query.

    Args:
        solr_query (str): The Solr query to execute.
        limit (int): The maximum number of results to return.

    Returns:
        dict: The JSON response from the UniProt API.
    """
    base_url = "https://rest.uniprot.org/uniprotkb/search"
    params = {
        "query": solr_query,
        "format": "json",
        "size": limit
    }
    response = requests.get(base_url, params=params)
    return response.json()