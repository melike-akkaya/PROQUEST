import os
import sys
import time
import pandas as pd
from openpyxl import Workbook

sys.path.append('/Users/sezin/Desktop/Uniprot-LLM/src')  # Update this to the correct absolute path
from prompt import generate_solr_query, query_uniprot
from langchain_google_genai import GoogleGenerativeAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_mistralai.chat_models import ChatMistralAI

# Dummy data replacements for the search and result fields
searchFields = "List of fields provided by database schema or explicit definition in the script"
resultFields = "Expected fields in results according to needs"

# Assuming models initialization and API keys are managed as before
models = {
    "gemini-pro": "api-key",
    "gemini-1.5-flash": "api-key",
    "meta/llama-3.1-405b-instruct": "api-key",
    "mistral-small": "api-key"
}

with open('test/queries.txt', 'r') as file:
    queries = [q.strip() for q in file if q.strip()]

wb = Workbook()
wb.remove(wb.active)

for model_name, api_key in models.items():
    # Instantiate the language model depending on the provider
    if model_name in ["gemini-pro", "gemini-1.5-flash"]:
        llm = GoogleGenerativeAI(model=model_name, google_api_key=api_key)
    elif model_name == "meta/llama-3.1-405b-instruct":
        llm = ChatNVIDIA(model=model_name, api_key=api_key)
    elif model_name == "mistral-small":
        llm = ChatMistralAI(model=model_name, api_key=api_key)

    data = []
    for query in queries:
        retry_count = 10
        temp_solr = ""
        temp_result = ""
        while retry_count != 0:
            try:
                solr_query = generate_solr_query(query, llm, searchFields, resultFields)
                result = query_uniprot(solr_query, limit=1)
                if 'results' in result and result['results']:
                    first_result = (result['results'][0]).get('proteinDescription', {}).get('recommendedName', {}).get('fullName', {}).get('value', 'N/A')
                    print(f"{11-retry_count}. Result successfully found for '{query}'")
                    retry_count -= 1
                    break  # exit loop if a valid result is found
                else:
                    temp_solr = solr_query
                    temp_result = 'NULL'
                    first_result = 'NULL'
                    print(f"{11-retry_count}. Cannot find a result for '{query}'")

            except Exception as e:
                if (temp_solr != "" and temp_result != ""):
                    solr_query = temp_solr
                    first_result = temp_result
                else:
                    solr_query = "ERROR"
                    first_result = "ERROR"
                print(f"{11-retry_count}. Error processing query '{query}': {str(e)}")

            retry_count -= 1
            time.sleep(3)

        row = [query, solr_query, str(first_result), 10-retry_count]
        data.append(row)
        time.sleep(5)

    safe_title = model_name.replace("/", "-").replace("\\", "-").replace("?", "").replace("*", "").replace("[", "").replace("]", "").replace(":", "-")
    ws = wb.create_sheet(title=safe_title)
    ws.append(["Query", "Generated Solr Query", "First Return Value", "xth Try"])
    for row in data:
        ws.append(row)

wb.save('results.xlsx')