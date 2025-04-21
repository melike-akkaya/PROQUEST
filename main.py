import streamlit as st
import requests
import pandas as pd
import io

BACKEND_URL = "http://localhost:8000"

st.set_page_config(page_title="ProQuest", layout="wide")

if 'log_stream' not in st.session_state:
    st.session_state.log_stream = io.StringIO()
if 'sequence_input' not in st.session_state:
    st.session_state.sequence_input = ""
if 'trigger_example_search' not in st.session_state:
    st.session_state.trigger_example_search = False

tabs = st.tabs(["LLM Query", "Vector Search"])

st.sidebar.title("About")
st.sidebar.info(
    "This app allows you to query the UniProt KB database using natural language. "
    "It converts your question into a Solr query via a Language Model and fetches relevant protein information."
)
st.sidebar.info(
    "The Vector Search feature finds proteins with similar sequences using ProtT5 embeddings."
)
st.sidebar.title("Team Members")
with st.sidebar:
    st.markdown("""
<div style="background-color:#dde3ed; padding:10px; border-radius:5px;">
<p><strong>· Sezin Yavuz</strong></p>
<p><strong>· Rauf Yanmaz</strong></p>
<p><strong>· Melike Akkaya</strong></p>
<p><strong>· Tunca Doğan</strong></p>
</div>
""", unsafe_allow_html=True)

st.sidebar.title("Organization")
with st.sidebar:
    st.markdown("""
<div style="background-color:#dde3ed; padding:10px; border-radius:5px;">
<p><strong>Hacettepe University, Department of Computer Science</strong></p>
</div>
""", unsafe_allow_html=True)


# ─────────────────────────────────── LLM Query Tab ───────────────────────────────────
with tabs[0]:
    st.title("🧬 ProQuest: UniProtKB LLM Query Interface v0.3")
    model_choices = [
        "Select a model...",
        "deepseek/deepseek-r1", "deepseek/deepseek-r1:free",
        "claude-3-7-sonnet-latest", "claude-3-5-sonnet-20240620",
        "gemini-2.0-flash", "gemini-1.5-flash",
        "gemini-2.0-flash-thinking-exp-01-21", "gemini-2.0-pro-exp-02-05",
        "o3-mini", "gpt-4o-mini", "gpt-4o",
        "meta/llama-3.1-405b-instruct",
        "mistral-small", "codestral-latest"
    ]
    with st.form("query_form"):
        llm_type    = st.selectbox("Select LLM Type", model_choices)
        api_key     = st.text_input("Enter your API Key", type="password")
        verbose     = st.checkbox("Enable verbose mode")
        limit       = st.number_input("Set return limit", min_value=1, max_value=100, value=5)
        retry_count = st.number_input("Set retry count", min_value=1, value=10)
        question    = st.text_input("Enter your question about proteins:",
                                    placeholder="e.g., What proteins are related to Alzheimer's disease?")
        submitted   = st.form_submit_button("Search")

    if submitted:
        if llm_type == "Select a model...":
            st.warning("Please select an LLM type.")
        elif not api_key:
            st.warning("Please enter your API key.")
        elif not question:
            st.warning("Please enter a question.")
        else:
            payload = {
                "model": llm_type,
                "api_key": api_key,
                "verbose": verbose,
                "limit": limit,
                "retry_count": retry_count,
                "question": question
            }
            with st.spinner("Generating query and fetching results..."):
                r = requests.post(f"{BACKEND_URL}/llm_query", json=payload)

            if r.ok:
                data = r.json()
                st.subheader("Generated Solr Query:")
                st.code(data["solr_query"])
                st.subheader("Results:")
                for item in data["results"].get("results", []):
                    with st.expander(f"{item['entryType']}: {item['primaryAccession']}"):
                        st.write(f"**Protein Name:** {item.get('proteinDescription',{}).get('recommendedName',{}).get('fullName',{}).get('value','N/A')}")
                        st.write(f"**UniProt KB Entry Link:** [https://www.uniprot.org/uniprotkb/{item['primaryAccession']}]")
                        st.write(f"**Gene:** {item.get('genes',[{}])[0].get('geneName',{}).get('value','N/A')}")
                        st.write(f"**Organism:** {item.get('organism',{}).get('scientificName','N/A')}")
                        st.write(f"**Function:** {item.get('comments',[{}])[0].get('texts',[{}])[0].get('value','N/A') if item.get('comments') else 'N/A'}")

                if verbose:
                    st.subheader("Debug Logs:")
                    st.code(data.get("logs",""))
                    st.subheader("Full Query Result:")
                    st.json(data["results"])
            else:
                st.error(f"Error {r.status_code}: {r.text}")


# ───────────────────────────────── Vector Search Tab ─────────────────────────────────
with tabs[1]:
    st.title("🔎 ProQuest: Vector Search v0.2")

    EXAMPLE_SEQUENCE = """MTAIIKEIVSRNKRRYQEDGFDLDLTYIYPNIIAMGFPAERLEGVYRNNIDDVVRFLDSK
HKNHYKIYNLCAERHYDTAKFNCRVAQYPFEDHNPPQLELIKPFCEDLDQWLSEDDNHVA
AIHCKAGKGRTGVMICAYLLHRGKFLKAQEALDFYGEVRTRDKKGVTIPSQRRYVYYYSY
LLKNHLDYRPVALLFHKMMFETIPMFSGGTCNPQFVVCQLKVKIYSSNSGPTRREDKFMY
FEFPQPLPVCGDIKVEFFHKQNKMLKKDKMFHFWVNTFFIPGPEETSEKVENGSLCDQEI
DSICSIERADNDKEYLVLTLTKNDLDKANKDKANRYFSPNFKVKLYFTKTVEEPSNPEAS
SSTSVTPDVSDNEPDHYRYSDTTDSDPENEPFDEDQHTQITKV"""

    col1, col2 = st.columns([3, 2])
    with col1:
        if st.button("🔬 Load an example sequence"):
            st.session_state.sequence_input = EXAMPLE_SEQUENCE
            st.session_state.trigger_example_search = True

    with st.form("vector_search_form"):
        sequence_input = st.text_area(
            "Enter your protein sequence:",
            placeholder="e.g., MKTFFVAGVLAALATA...",
            key="sequence_input"
        )
        search_button = st.form_submit_button("Search")

    if st.session_state.trigger_example_search:
        search_button = True
        st.session_state.trigger_example_search = False

    if search_button:
        if not sequence_input.strip():
            st.warning("Please enter a protein sequence.")
        else:
            raw = sequence_input.strip()
            if raw.startswith(">"):
                seq = "".join(line for line in raw.splitlines() if not line.startswith(">"))
                st.info("Detected FASTA header – stripping it out.")
            else:
                seq = raw.replace("\n", "").strip()

            payload = {"sequence": sequence_input}
            with st.spinner("Searching for similar protein sequences..."):
                r = requests.post(f"{BACKEND_URL}/vector_search", json=payload)

            if r.ok:
                data = r.json()
                st.subheader("Search Results:")
                st.write("✅ Embedding complete!")
                st.write(f"⏳ Embedding time: {data['embedding_time']} seconds")
                st.write(f"🔍 Search time: {data['search_time']} seconds")

                if not data["found_embeddings"]:
                    st.warning("❌ No similar proteins found.")
                else:
                    go_df = pd.DataFrame(data["go_enrichment"])
                    with st.expander("📊 View GO Term Enrichment Table"):
                        for ns in go_df["Namespace"].unique():
                            sub = go_df[go_df["Namespace"] == ns].copy().head(10)
                            sub["Associated Protein IDs"] = sub["Associated Protein IDs"].apply(
                                lambda x: ", ".join(x.split(", ")[:5]) + ("..." if len(x.split(", ")) > 5 else "")
                            )
                            sub["GO ID"] = sub["GO ID"].apply(
                                lambda g: f'<a href="https://www.ebi.ac.uk/QuickGO/term/{g}" target="_blank">{g}</a>'
                            )
                            sub.index = range(1, len(sub) + 1)
                            st.markdown(f"#### Namespace: {ns} (top 10)")
                            st.markdown(sub.to_html(escape=False), unsafe_allow_html=True)
                        csv_go = go_df.to_csv(index=False)
                        st.download_button(
                            "Download the Whole GO Term Enrichment Table as CSV",
                            csv_go,
                            file_name="go_enrichment_table.csv",
                            mime="text/csv"
                        )
                        st.caption("Download will reset the page!")

                    st.success("✅ Similar proteins found!")
                    st.write("Distance Metric: Angular")
                    df_found = pd.DataFrame(data["found_embeddings"])
                    df_found["Protein ID"] = df_found["Protein ID"].apply(
                        lambda pid: f'<a href="https://www.uniprot.org/uniprotkb/{pid}" target="_blank">{pid}</a>'
                    )
                    df_found.index = range(1, len(df_found) + 1)
                    csv_hits = pd.DataFrame(data["found_embeddings"]).to_csv(index=False)
                    st.download_button(
                        "Download Protein Hits Table as CSV",
                        csv_hits,
                        file_name="similar_proteins_table.csv",
                        mime="text/csv"
                    )
                    st.caption("Download will reset the page!")
                    st.write(df_found.to_html(escape=False), unsafe_allow_html=True)
            else:
                st.error(f"Error {r.status_code}: {r.text}")
