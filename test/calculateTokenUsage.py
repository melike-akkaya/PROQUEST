from transformers import GPT2Tokenizer
import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from main import fetch_data_from_db
import seaborn as sns
import matplotlib.pyplot as plt

def calculateTokenSize(code: str, model_name='gpt2'):
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)

    tokens = tokenizer.encode(code)

    return len(tokens)

with open("asset/queryfields.txt", "r") as f:
    queryFields = f.read()
with open("asset/result-fields.json", "r") as f:
    resultFields = f.read()
with open("asset/search-fields.json", "r") as f:
    searchFields = f.read()
searchFieldsImproved = fetch_data_from_db("SELECT * FROM search_fields")
resultFieldsImproved = fetch_data_from_db("SELECT * FROM result_fields")

def generatePromptCode(searchfields, resultfields, 
                       queryfields = queryFields, 
                       question = "What proteins are related to Alzheimer's disease?"):
    return (f"""Task: Generate a Solr query for the UniProt database from a natural language query. 
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
        Generate a Solr query for the UniProt database based on this natural language query.""")


code = generatePromptCode(searchFields, resultFields)
tokenSize = calculateTokenSize(code)

codeImproved = generatePromptCode(searchFieldsImproved, resultFieldsImproved)
tokenSizeImproved = calculateTokenSize(codeImproved)

token_sizes = {'Original Code': tokenSize, 'Improved Code': tokenSizeImproved}
versions = list(token_sizes.keys())
sizes = list(token_sizes.values())

sns.set(style="whitegrid")
plt.figure(figsize=(10, 6))
ax = sns.barplot(x=versions, y=sizes, palette='coolwarm')

plt.title('Token Size Comparison', fontsize=16)
plt.xlabel('Code Version', fontsize=14)
plt.ylabel('Number of Tokens', fontsize=14)

for i, size in enumerate(sizes):
    ax.text(i, size + 500, f'{size}', ha='center', va='bottom', fontsize=12)

plt.tight_layout()
plt.savefig('token_size_comparison.png')