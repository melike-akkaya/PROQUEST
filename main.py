import streamlit as st 
from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_mistralai.chat_models import ChatMistralAI
import logging
from src.prompt import query_uniprot, generate_solr_query
import io
import sqlite3
import time 
from datetime import datetime
from src.prott5Embedder import getEmbeddings
from src.relevantGOIdFinder import findRelatedGoIds
from src.relevantProteinFinder import searchSpecificEmbedding

def fetch_data_from_db(query, params=None):
    with sqlite3.connect(sqliteDb) as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        data = cur.fetchall()
    return data

if 'log_stream' not in st.session_state:
    st.session_state.log_stream = io.StringIO()

logging.basicConfig(stream=st.session_state.log_stream, level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

st.set_page_config(page_title="ProQuest", layout="wide")

# Session state başlatmaları
if 'log_stream' not in st.session_state:
    st.session_state.log_stream = io.StringIO()

# VECTOR SEARCH için session state
if 'sequence_input' not in st.session_state:
    st.session_state.sequence_input = ""
if 'trigger_example_search' not in st.session_state:
    st.session_state.trigger_example_search = False

tabs = st.tabs(["LLM Query", "Vector Search"]) # two modes

sqliteDb = "asset/protein_index.db"

st.sidebar.title("About")
st.sidebar.info(
    "This app allows you to query the UniProt KB database using natural language. "
    "It converts your question into a Solr query using a Language Model and fetches relevant protein information."
)

st.sidebar.info(
    "The Vector Search feature enables you to find proteins with similar sequences using advanced sequence embeddings. "
    "By utilizing the ProtT5 model for embedding generation, the system performs fast, approximate nearest-neighbor searches, "
    "offering an efficient alternative to traditional tools like BLAST. This allows you to discover functionally similar proteins "
    "and their related Gene Ontology terms, accelerating protein-related research and analysis."
)

st.sidebar.title("Team Members")
with st.sidebar:
    st.markdown("""<div style="background-color:#FAEBD7; padding:10px; border-radius:5px;">
                    <p style="margin-bottom: 0; color: black;">- Sezin Yavuz</p>
                    <p style="margin-bottom: 0; color: black;">- Rauf Yanmaz</p>
                    <p style="margin-bottom: 0; color: black;">- Melike Akkaya</p>
                    <p style="margin-bottom: 0; color: black;">- Tunca Doğan</p>
                    <p style="margin-bottom: 0; color: black;">  <strong>Hacettepe University, Department of Computer Science</strong></p>
                  </div>""", unsafe_allow_html=True)

with tabs[0]: # LLM Query Tab
    with st.spinner("Loading required fields..."):
        if 'queryfields' not in st.session_state:
            with open("asset/queryfields.txt", "r") as f:
                st.session_state.queryfields = f.read()
        if 'searchfields' not in st.session_state:
            st.session_state.searchfields = fetch_data_from_db("SELECT * FROM search_fields")
        if 'resultfields' not in st.session_state:
            st.session_state.resultfields = fetch_data_from_db("SELECT * FROM result_fields")
    st.title("🧬 ProQuest: UniProtKB LLM Query Interface v0.3")
    model_choices = [
        "Select a model...",
        "deepseek/deepseek-r1", "deepseek/deepseek-r1:free",
        "claude-3-7-sonnet-latest", "claude-3-5-sonnet-20240620", 
        "gemini-2.0-flash", "gemini-pro", "gemini-1.5-flash", "gemini-2.0-flash-thinking-exp-01-21", "gemini-2.0-pro-exp-02-05",
        "o3-mini", "gpt-4o-mini", "gpt-4o",
        "meta/llama-3.1-405b-instruct",
        "mistral-small", "codestral-latest"
    ]
    with st.form("query_form"):
        # LLM selection
        llm_type = st.selectbox("Select LLM Type", model_choices)

        # API Key input
        api_key = st.text_input("Enter your API Key", type="password")

        # Verbose mode
        verbose = st.checkbox("Enable verbose mode")

        # Return limit
        limit = st.number_input("Set return limit", min_value=1, max_value=100, value=5)

        # retry count
        retry_count = st.number_input("Set retry count", min_value=1, value=10)

        question = st.text_input("Enter your question about proteins:", placeholder="e.g., What proteins are related to Alzheimer's disease?")

        # Submit button
        submitted = st.form_submit_button("Search")

        # counter func
        def retries_counter(question, llm, searchfields, queryfields, resultfields, limit, retry_count):
            temp_solr = ""
            temp_result = ""
            status_placeholder = st.empty()
            current_attempt = 1
            total_count = retry_count
            while retry_count > 0:
                status_placeholder.info(f"Attempt {current_attempt} for query '{question}'...")
                try:
                    solr_query = generate_solr_query(question, llm, searchfields, queryfields, resultfields)
                    results = query_uniprot(solr_query, limit)
                    if results.get('results'):
                        status_placeholder.success(f"Results found on attempt {current_attempt}.")
                        return solr_query, results
                    else:
                        temp_solr = solr_query
                        temp_result = results
                        if current_attempt == total_count:
                            status_placeholder.error(f"No results found for query '{question}' after {total_count} attempts.")
                        else:
                            status_placeholder.warning(f"No results found on attempt {current_attempt}.")
                except Exception as e:
                    status_placeholder.error(f"Error on attempt {current_attempt}: {str(e)}")
                    if temp_solr:
                        solr_query = temp_solr
                    else:
                        solr_query = "ERROR"
                        temp_result = {"results": []}
                current_attempt += 1
                retry_count -= 1
                time.sleep(3)  

            # Return last attempt's Solr query and result (empty if no success)
            #st.error(f"No results found for query '{question}' after {total_count} attempts.")
            return temp_solr or "ERROR", temp_result

    if submitted:
        if question and api_key:
            try:
                # Clear log stream
                st.session_state.log_stream.seek(0)
                st.session_state.log_stream.truncate()

                if llm_type in ["gemini-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-thinking-exp-01-21", "gemini-2.0-pro-exp-02-05"]:
                    llm = GoogleGenerativeAI(model=llm_type, google_api_key=api_key)
                elif llm_type in ["gpt-4o", "gpt-4o-mini", "o3-mini"]:
                    llm = ChatOpenAI(model=llm_type, api_key=api_key)
                elif llm_type in ["claude-3-5-sonnet-20240620", "claude-3-7-sonnet-latest"]:
                    llm = ChatAnthropic(model=llm_type, anthropic_api_key=api_key)
                elif llm_type == "meta/llama-3.1-405b-instruct":
                    llm = ChatNVIDIA(model=llm_type, api_key=api_key)
                elif llm_type in ["deepseek/deepseek-r1", "deepseek/deepseek-r1:free"]:
                    llm = ChatOpenAI(model=llm_type, api_key=api_key, base_url= "https://openrouter.ai/api/v1")
                elif llm_type in ["mistral-small", "codestral-latest"]:
                    llm = ChatMistralAI(model=llm_type, api_key=api_key)
                
                if verbose:
                    logger.info(f"Using LLM: {llm_type}")
                    logger.info(f"Question: {question}")
                    logger.info(f"Limited to {limit} results")
                
                with st.spinner("Generating query and fetching results..."):
                    solr_query, results = retries_counter(
                        question,
                        llm,
                        st.session_state.searchfields,
                        st.session_state.queryfields,
                        st.session_state.resultfields,
                        limit,
                        retry_count
                    )

                    st.subheader("Generated Solr Query:")
                    st.code(solr_query)
                    if verbose:
                        logger.info(f"Generated Solr query: {solr_query}")
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
                        st.subheader("Full Query Result:")
                        st.json(results)

                    time.sleep(5)

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                if verbose:
                    logger.error(f"Error details: {str(e)}", exc_info=True)
        elif llm_type == "Select a model...":
            st.warning("Please select an LLM type.")            
        elif not api_key:
            st.warning("Please enter your API key.")
        elif not question:
            st.warning("Please enter a question.")

with tabs[1]:  # Vector Search Tab
    st.title("🔎 ProQuest: Vector Search v0.2")

    EXAMPLE_SEQUENCE = """MTAIIKEIVSRNKRRYQEDGFDLDLTYIYPNIIAMGFPAERLEGVYRNNIDDVVRFLDSK\nHKNHYKIYNLCAERHYDTAKFNCRVAQYPFEDHNPPQLELIKPFCEDLDQWLSEDDNHVA\nAIHCKAGKGRTGVMICAYLLHRGKFLKAQEALDFYGEVRTRDKKGVTIPSQRRYVYYYSY\nLLKNHLDYRPVALLFHKMMFETIPMFSGGTCNPQFVVCQLKVKIYSSNSGPTRREDKFMY\nFEFPQPLPVCGDIKVEFFHKQNKMLKKDKMFHFWVNTFFIPGPEETSEKVENGSLCDQEI\nDSICSIERADNDKEYLVLTLTKNDLDKANKDKANRYFSPNFKVKLYFTKTVEEPSNPEAS\nSSTSVTPDVSDNEPDHYRYSDTTDSDPENEPFDEDQHTQITKV"""

    # example sequence
    col1, col2 = st.columns([3, 2])
    with col1:
        if st.button("🔬 Load an example sequence"):
            st.session_state.sequence_input = EXAMPLE_SEQUENCE
            st.session_state.trigger_example_search = True


    with st.form("vector_search_form"):
        sequence_input = st.text_area(
            "Enter your protein sequence:",
            placeholder="e.g., MKTFFVAGVLAALATA...",
            #added
            key="sequence_input"
        )

        search_button = st.form_submit_button("Search")

    if st.session_state.trigger_example_search:
        search_button = True
        st.session_state.trigger_example_search = False  
    

    if search_button:
        if sequence_input:
            # ───  PREPROCESS FASTA ────────────────────────────────────────
            raw = sequence_input.strip()
            if raw.startswith(">"):
                seq = "".join(
                    line.strip()
                    for line in raw.splitlines()
                    if line and not line.startswith(">")
                )
                st.info("Detected FASTA header – stripping it out.")
            else:
                seq = raw.replace("\n", "").strip()

            st.subheader("Search Results:")
            st.write("🔄 Searching for similar protein sequences...")

            sequence_dict = {"query_protein": sequence_input}
            startTimeToCreateEmbedding = datetime.now()
            embDict, tempDict = getEmbeddings(seq_dict=sequence_dict, visualize=True, per_protein=True)
            endTimeToCreateEmbedding = datetime.now()

            query_embedding = embDict["query_protein"]

            startTimeToFindByEmbedding = datetime.now()
            foundEmbeddings = searchSpecificEmbedding(query_embedding)
            endTimeToFindByEmbedding = datetime.now()

            # distance should be in the range: 0 <= distance <= 0.40
            # therefore similarity should be in the range: 1 >= similarity >= 0.60
            foundEmbeddings = foundEmbeddings[(foundEmbeddings['Similarity'] >= 0.60) & (foundEmbeddings['Similarity'] <= 1.0)]

            embeddingTime = endTimeToCreateEmbedding - startTimeToCreateEmbedding
            searchTime = endTimeToFindByEmbedding - startTimeToFindByEmbedding

            st.write("✅ Embedding process completed!")
            st.write(f"⏳ Embedding time: {embeddingTime.total_seconds()} seconds")
            st.write(f"🔍 Search time: {searchTime.total_seconds()} seconds")

            if foundEmbeddings.empty:
                st.warning("❌ No similar proteins found.")
            else:
                st.success("✅ Similar proteins found!")
                st.write("Distance Metric: Angular")

                # distance should be in the range: 0 <= distance <= 0.25
                # therefore similarity should be in the range: 1 >= similarity >= 0.75
                foundEmbeddings = foundEmbeddings[(foundEmbeddings['Similarity'] >= 0.75)]
                proteinIdList = foundEmbeddings['Protein ID'].str.extract(r'>(.+)<')[0].fillna(foundEmbeddings['Protein ID']).tolist()
                go_enrichment_df = findRelatedGoIds(proteinIdList, dbPath=sqliteDb)

                with st.expander("📊 View GO Term Enrichment Table"):
                    for namespace in go_enrichment_df['Namespace'].unique():
                        st.markdown(f"#### Namespace: {namespace} (Selected enriched terms)")
                        df_ns = go_enrichment_df[go_enrichment_df['Namespace'] == namespace].head(10).copy()

                        df_ns['Associated Protein IDs'] = df_ns['Associated Protein IDs'].apply(
                            lambda x: ', '.join(x.split(', ')[:5]) + "..." 
                                      if len(x.split(', ')) > 5 else x
                        )

                        df_ns["GO ID"] = go_enrichment_df["GO ID"].apply(
                            lambda go: f'<a href="https://www.ebi.ac.uk/QuickGO/term/{go}" target="_blank">{go}</a>'
                        )

                        df_ns.index = range(1, len(df_ns) + 1)

                        html_table = df_ns.to_html(escape=False, index=True)
                        html_table = html_table.replace(
                            "<th>Definition</th>",
                            "<th style='max-width: 250px; word-wrap: break-word;'>Definition</th>"
                        )
                        scrollable = f"""
                        <div style="overflow-x: auto; width: 100%; margin-bottom: 1em;">
                          <table style="min-width: 1800px; width: 100%; border-collapse: collapse; font-size: 14px;">
                            {''.join(html_table.splitlines()[1:])}
                          </table>
                        </div>
                        """
                        st.markdown(scrollable, unsafe_allow_html=True)
                    
                    # download GO term table
                    csv_go = go_enrichment_df.to_csv(index=True)
                    st.download_button(
                        label="Download the Whole GO Term Enrichment Table as CSV",
                        data=csv_go,
                        file_name="go_enrichment_table.csv",
                        mime="text/csv"
                    )
                    st.caption("Download operation will reset the page!") 

                foundEmbeddings_download = foundEmbeddings.copy()
                csv_found = foundEmbeddings_download.to_csv(index=False)
                st.download_button(
                    label="Download Protein Hits Table as CSV",
                    data=csv_found,
                    file_name="similar_proteins_table.csv",
                    mime="text/csv"
                )
                st.caption("Download operation will reset the page!") 
                foundEmbeddings["Protein ID"] = foundEmbeddings["Protein ID"].apply(
                    lambda pid: f'<a href="https://www.uniprot.org/uniprotkb/{pid}" target="_blank">{pid}</a>'
                )
                foundEmbeddings.index = range(1, len(foundEmbeddings) + 1)
                st.write(foundEmbeddings.to_html(escape=False), unsafe_allow_html=True)
                
        else:
            st.warning("Please enter a protein sequence.")