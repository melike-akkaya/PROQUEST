import pandas as pd
import json
import os
import sqlite3
from datasets import Dataset
from ragas.evaluation import evaluate
from ragas.metrics import faithfulness, answer_relevancy

os.environ["OPENAI_API_KEY"] = ""

conn = sqlite3.connect("backend/asset/protein_index.db")

excel_path = "backend/Keyword Search with BM25 Encoder Analysis with Flat File Generated Questions.xlsx"
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

        file_ids = [r[0] for r in file_id_rows]

        placeholders = ",".join(["?"] * len(file_ids)) if file_ids else "NULL"
        contexts = []
        if file_ids:
            context_rows = conn.execute(f"""
                SELECT content FROM flat_files WHERE file_id IN ({placeholders})
            """, file_ids).fetchall()
            contexts = [r[0] for r in context_rows]

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

with open("ragas_results.txt", "w", encoding="utf-8") as f_out:
    f_out.write("questionId; protein_id; faithfulness;answer_relevancy")
    for idx, (rec, score_dict) in enumerate(zip(records, results.scores)):
        line = f"{rec['question_id']}; {rec['protein_id']}; {score_dict.get('faithfulness'):.3f}; {score_dict.get('answer_relevancy'):.3f}\n"
        f_out.write(line)