from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import LLMChain
import requests

def generate_solr_query(question, llm, searchFields, queryFields, resultFields):
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
- Always use the "term" field from the search field definition as the Solr field name.
- Do NOT use the "id" field directly in the query; it is only a label and not a valid Solr field.
- For any cross-reference fields that start with "xref_", such as "xref_pfam", "xref_orthodb", "xref_dbsnp", "xref_interpro", etc., do NOT use the full "xref_*" field name in the Solr query.
- Instead, always use the Solr field name "xref", and construct the value by prepending the appropriate prefix.
- Use the part after "xref_" as the prefix and combine it with the value using a hyphen ("-").

  Examples:
  - "xref_pfam:PF00059"      → "xref:pfam-PF00059"
  - "xref_orthodb:P53_HUMAN" → "xref:orthodb-P53_HUMAN"
  - "xref_dbsnp:rs63750001"  → "xref:dbsnp-rs63750001"
  - "xref_interpro:IPR002413"→ "xref:interpro-IPR002413"
 
   Examples:

    Input: Find proteins with Pfam domain PF00059  
    Output: (xref:pfam-PF00059)

    Input: Search for entries linked to dbSNP rs63750001  
    Output: (xref:dbsnp-rs63750001)

    Input: Get proteins with InterPro domain IPR002413  
    Output: (xref:interpro-IPR002413)

- This transformation must be applied consistently to all such cross-reference fields.
- Do not use field names like "xref_pfam" or "xref_orthodb" directly in the query. They are not valid Solr fields.


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
    solr_query = chain.run(question=question, searchfields=searchFields, queryfields=queryFields, resultfields=resultFields)
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