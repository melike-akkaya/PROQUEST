import pandas as pd
from langchain_google_genai import GoogleGenerativeAI
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import sys
import os

# getting proper functions for custom modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import fetch_data_from_db
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from prompt import generate_solr_query

API_KEY = "YOUR_API_KEY_HERE"

with open("asset/queryfields.txt", "r") as f:
    queryFields = f.read()
searchFields = fetch_data_from_db("SELECT * FROM search_fields")
resultFields = fetch_data_from_db("SELECT * FROM result_fields")

with open('./test/queries.txt', 'r') as file:
    lines = file.readlines()
    queries = [line.split('\t')[0].strip() for line in lines]
    correct_solr_sql = [line.split('\t')[1].strip() for line in lines]

llm = GoogleGenerativeAI(model="gemini-pro", google_api_key=API_KEY)

results = []
for question, correct_query in zip(queries, correct_solr_sql):
    try:
        generated_query = generate_solr_query(question, llm, searchFields, queryFields, resultFields)
        results.append((question, correct_query, generated_query))
    except Exception as e:
        print(f"Error processing query '{question}': {str(e)}")
        results.append((question, correct_query, None))

df_results = pd.DataFrame(results, columns=['Query', 'Correct Solr SQL', 'Generated Solr SQL'])

df_results['Match'] = df_results.apply(
    lambda row: row['Correct Solr SQL'] == row['Generated Solr SQL'], axis=1
)
accuracy = accuracy_score(df_results['Match'], [True] * len(df_results))
precision = precision_score(df_results['Match'], [True] * len(df_results), zero_division=0)
recall = recall_score(df_results['Match'], [True] * len(df_results), zero_division=0)
f1 = f1_score(df_results['Match'], [True] * len(df_results), zero_division=0)

print("Results Table:")
print(df_results)
print(f"Accuracy: {accuracy:.2f}, Precision: {precision:.2f}, Recall: {recall:.2f}, F1 Score: {f1:.2f}")

df_results.to_csv('./test/results.csv', index=False)
