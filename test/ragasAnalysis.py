import pandas as pd
import json
import os
import sqlite3
from datasets import Dataset
from ragas.evaluation import evaluate
from ragas.metrics import faithfulness, answer_relevancy
import re

os.environ["OPENAI_API_KEY"] = ""

conn = sqlite3.connect("backend/asset/protein_index.db")

def process_content(content):
    cleaned_content = re.sub(r'^[A-Z]{2}\s+-\S+\t', '', content, flags=re.MULTILINE)
    cleaned_content = re.sub(r'\n\s+', ' ', cleaned_content)
    cleaned_content = cleaned_content.strip()
    return cleaned_content

def ragasAnalysis(excel_path, output_path):
    df = pd.read_excel(excel_path, sheet_name="gemini-2.0-flash-thinking-exp-0")

    records = []

    for idx, row in df.iterrows():
        question = row["question"]
        answer = row["answer"]
        protein_ids = [pid.strip() for pid in str(row["proteinIds"]).split(",")]

        for protein_id in protein_ids:
            file_id_rows = conn.execute("""
                select content from flat_files where file_id in (select file_id from flat_files_mapping where protein_id = ?)
            """, (protein_id,)).fetchall()

            contexts = []
            for file_id_row in file_id_rows:
                content = file_id_row[0]
                processed_content = process_content(content)
                contexts.append(processed_content)

            records.append({
                "question": question,
                "answer": answer,
                "contexts": contexts,
                "protein_id": protein_id,
                "question_id": idx + 1
            })

    dataset = Dataset.from_list([
        {
            "question": r["question"],
            "answer": r["answer"],
            "contexts": r["contexts"]
        } for r in records
    ])

    metrics = [faithfulness, answer_relevancy]
    results = evaluate(dataset, metrics=metrics)

    with open(output_path, "w", encoding="utf-8") as f_out:
        f_out.write("questionId; protein_id; faithfulness; answer_relevancy")
        for idx, (rec, score_dict) in enumerate(zip(records, results.scores)):
            line = f"{rec['question_id']}; {rec['protein_id']}; {score_dict.get('faithfulness'):.3f}; {score_dict.get('answer_relevancy'):.3f}\n"
            f_out.write(line)