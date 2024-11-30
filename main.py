import streamlit as st
from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_mistralai.chat_models import ChatMistralAI
import logging
from src.prompt import query_uniprot, generate_solr_query
import io
from contextlib import redirect_stdout
import sqlite3

def fetch_data_from_db(query, params=None):
    with sqlite3.connect('asset_uniprot.db') as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        data = cur.fetchall()
    return data

# Initialize logging stream in session state if not already present
if 'log_stream' not in st.session_state:
    st.session_state.log_stream = io.StringIO()

# Configure logging
logging.basicConfig(stream=st.session_state.log_stream, level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set up the Streamlit page configuration
st.set_page_config(page_title="UniProt KB Query Interface", layout="wide")

# Get queryfields, result fields and searchfields from files, store them in session state so that they are not recalculated on every rerun
with st.spinner("Loading required fields..."):
    if 'queryfields' not in st.session_state:
        with open("asset/queryfields.txt", "r") as f:
            st.session_state.queryfields = f.read()
    if 'searchfields' not in st.session_state:
        st.session_state.searchfields = fetch_data_from_db("SELECT * FROM search_fields")
    if 'resultfields' not in st.session_state:
        st.session_state.resultfields = fetch_data_from_db("SELECT * FROM result_fields")

st.title("🧬 UniProt KB LLM Query Interface v0.21")

model_choices = [
    "gemini-pro", "gemini-1.5-flash", "gpt-4o-mini", "gpt-4o",
    "claude-3-5-sonnet-20240620", "meta/llama-3.1-405b-instruct",
    "mistral-small", "codestral-latest"
]

# Streamlit form
with st.form("query_form"):
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

if submitted and question and api_key:
    try:
        # Clear log stream
        st.session_state.log_stream.seek(0)
        st.session_state.log_stream.truncate()

        # Set up LLM based on selection and API key
        if llm_type in ["gemini-pro", "gemini-1.5-flash"]:
            llm = GoogleGenerativeAI(model=llm_type, google_api_key=api_key)
        elif llm_type in ["gpt-4o", "gpt-4o-mini"]:
            llm = ChatOpenAI(model=llm_type, api_key=api_key)
        elif llm_type == "claude-3-5-sonnet-20240620":
            llm = ChatAnthropic(model=llm_type, anthropic_api_key=api_key)
        elif llm_type == "meta/llama-3.1-405b-instruct":
            llm = ChatNVIDIA(model=llm_type, api_key=api_key)
        elif llm_type in ["mistral-small", "codestral-latest"]:
            llm = ChatMistralAI(model=llm_type, api_key=api_key)

        if verbose:
            logger.info(f"Using LLM: {llm_type}")
            logger.info(f"Question: {question}")
            logger.info(f"Limited to {limit} results")

        with st.spinner("Generating query and fetching results..."):
            solr_query = generate_solr_query(question, llm, st.session_state.searchfields, st.session_state.queryfields, st.session_state.resultfields)
            st.subheader("Generated Solr Query:")
            st.code(solr_query)
            if verbose:
                logger.info(f"Generated Solr query: {solr_query}")

            results = query_uniprot(solr_query, limit)

            st.subheader("Results:")
            for item in results.get('results', []):
                with st.expander(f"{item['entryType']}: {item['primaryAccession']}"):
                    st.write(f"**Protein Name:** {item.get('proteinDescription', {}).get('recommendedName', {}).get('fullName', {}).get('value', 'N/A')}")
                    st.write(f"**UniProt KB Entry Link:** [https://www.uniprot.org/uniprotkb/{item.get('primaryAccession', 'N/A')}]")
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
elif not question:
    st.warning("Please enter a question.")

st.sidebar.title("About")
st.sidebar.info(
    "This app allows you to query the UniProt KB database using natural language. "
    "It converts your question into a Solr query using a Language Model and fetches relevant protein information."
)
