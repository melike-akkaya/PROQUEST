import streamlit as st
import requests
import json
import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import logging

import io
from contextlib import redirect_stdout

# Initialize logging stream in session state if not already present
if 'log_stream' not in st.session_state:
    st.session_state.log_stream = io.StringIO()

# Configure logging
logging.basicConfig(stream=st.session_state.log_stream, level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


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


# Set up the Streamlit page configuration
st.set_page_config(page_title="UniProt KB Query Interface", layout="wide")

# Get queryfields, result fields and searchfields from files, store them in session state so that they are not recalculated on every rerun
with st.spinner("Loading required fields..."):
    if 'queryfields' not in st.session_state:
        with open("config/queryfields.txt", "r") as f:
            st.session_state.queryfields = f.read()

    if 'resultfields' not in st.session_state:
        with open("config/resultfields.json", "r") as f:
            st.session_state.resultfields = json.load(f)

    if 'searchfields' not in st.session_state:
        with open("config/searchfields.json", "r") as f:
            st.session_state.searchfields = json.load(f)

st.title("🧬 UniProt KB LLM Query Interface V2")

# Streamlit form
with st.form("query_form"):
    model_choices = [
        "gemini-pro", "gemini-1.5-flash", "gpt-4o-mini", "gpt-4o","claude-3-5-sonnet-20240620", "meta/llama-3.1-405b-instruct"   
    ]

    # LLM selection
    llm_type = st.selectbox("Select LLM Type", model_choices)

    # API Key input
    api_key = st.text_input("Enter your API Key", type="password")

    # Verbose mode
    verbose = st.checkbox("Enable verbose mode")

    # Return limit
    limit = st.number_input("Set return limit", min_value=1, max_value=100, value=5)

    question = st.text_input("Enter your question about proteins:", placeholder="e.g., What proteins are related to Alzheimer's disease?")

    # Submit button
    submitted = st.form_submit_button("Search")

if submitted:
    if question and api_key:
        try:
            # Clear log stream
            st.session_state.log_stream.seek(0)
            st.session_state.log_stream.truncate()


            # Set up LLM based on selection and API key
            if llm_type == "gemini-pro":
                llm = GoogleGenerativeAI(model="gemini-pro", google_api_key=api_key)
            elif llm_type == "gemini-1.5-flash":
                llm = GoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            elif llm_type == "gpt-4o-mini":
                llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key)
            elif llm_type == "gpt-4o":
                llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
            elif llm_type == "claude-3-5-sonnet-20240620":
                llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", anthropic_api_key=api_key)
            elif llm_type == "meta/llama-3.1-405b-instruct":
                llm = ChatNVIDIA(model="meta/llama-3.1-405b-instruct", api_key=api_key)

            if verbose:
                logger.info(f"Using LLM: {llm_type}")
                logger.info(f"Question: {question}")
                logger.info(f"Limited to {limit} results")

            with st.spinner("Generating query and fetching results..."):
                solr_query = generate_solr_query(question, llm)
                st.subheader("Generated Solr Query:")
                st.code(solr_query)

                if verbose:
                    logger.info(f"Generated Solr query: {solr_query}")

                results = query_uniprot(solr_query, limit)

                st.subheader("Results:")
                for item in results.get('results', []):
                    with st.expander(f"{item['entryType']}: {item['primaryAccession']}"):
                        st.write(f"**Protein Name:** {item.get('proteinDescription', {}).get('recommendedName', {}).get('fullName', {}).get('value', 'N/A')}")
                        st.write(f"**UniProt KB Entry Link:** [{'https://www.uniprot.org/uniprotkb/' + item.get('primaryAccession', 'N/A')}]({'https://www.uniprot.org/uniprotkb/' + item.get('primaryAccession', 'N/A')})")
                        st.write(f"**Gene:** {item.get('genes', [{}])[0].get('geneName', {}).get('value', 'N/A')}")
                        st.write(f"**Organism:** {item.get('organism', {}).get('scientificName', 'N/A')}")
                        st.write(f"**Function:** {item.get('comments', [{}])[0].get('texts', [{}])[0].get('value', 'N/A') if item.get('comments') else 'N/A'}")

                if verbose:
                    st.subheader("Debug Logs:")
                    st.code(st.session_state.log_stream.getvalue())

                if verbose:
                    st.subheader("Full Query Result:")
                    st.json(results)

        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
            if verbose:
                logger.error(f"Error details: {str(e)}", exc_info=True)

    elif not api_key:
        st.warning("Please enter your API key.")
    else:
        st.warning("Please enter a question.")

st.sidebar.title("About")
st.sidebar.info(
    "This app allows you to query the UniProt KB database using natural language. "
    "It converts your question into a Solr query using a Language Model and fetches relevant protein information."
)