from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import streamlit as st
import requests

def generate_solr_query(question, llm):
    """
    Generate a Solr query for the UniProt database from a natural language query.

    Args:
        question (str): The natural language question to convert.
        llm (object): The language model to use for generating the query.

    Returns:
        str: The generated Solr query.
    """
    prompt = PromptTemplate(
        input_variables=["question", "searchfields", "queryfields", "resultfields"],
        template="""Task: Generate a Solr query for the UniProt database from a natural language query. 

Instructions: 
- Use only the provided search fields and their corresponding terms from the UniProt database. 
- Do not use any search fields or terms that are not provided in the UniProt documentation. 
- Ensure the syntax of the generated Solr query is correct and compatible with UniProt's search system. 
- Use the appropriate search field prefixes and syntax as specified in the UniProt documentation. 

Search Fields:
{searchfields}

Query Fields:
{queryfields}

Result Fields:
{resultfields}

Note: 
Do not include any explanations or apologies in your responses. 
Do not respond to any questions that might ask anything else than for you to construct a Solr query. 
Do not include any text except the generated Solr query. 
Do not make up search fields or terms that do not exist in the provided UniProt documentation. 
Use your internal knowledge to map the natural language query to appropriate search fields and terms in the UniProt database. 

Examples: Here are a few examples of generated Solr queries for particular natural language questions: 

# What are the mitochondrial proteins in mice?
(organism_name:mouse) AND (organelle:Mitochondrion)

# Find enzymes involved in glycolysis with a molecular weight over 100 kDa.
(ec:*) AND (go:"glycolysis") AND (mass:[100000 TO *])

# List all human kinases that have a 3D structure in PDB.
(organism_name:Human) AND (ec:2.7.*) AND (database:pdb)

# Give me the proteins with calcium binding that have a length greater than 1000 amino acids 
(length:[1000 TO *]) AND (ft_positional:calcium)

# Show me human proteins involved in DNA repair with a molecular weight between 50 and 100 kDa 
(organism_name:human) AND (go:DNA repair) AND (mass:[50000 TO 100000]) 

The question is: {question} 
Generate a Solr query for the UniProt database based on this natural language query."""
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    solr_query = chain.run(question=question, searchfields=st.session_state.searchfields, queryfields=st.session_state.queryfields, resultfields=st.session_state.resultfields)
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