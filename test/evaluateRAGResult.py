import os
import json
import time
from pathlib import Path

import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv

from openpyxl import load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows

from langchain_google_genai import GoogleGenerativeAI

INPUT_EXCEL = "test/ragAnalysisInputs/seq/RAG_Sequence_Search_Analysis.xlsx"
OUTPUT_EXCEL = "rag_gemini_evaluation.xlsx"

MODEL_NAME = "gemini-2.5-flash"
TEMPERATURE = 0.0
SLEEP_BETWEEN_CALLS = 1.2

load_dotenv()
GOOGLE_API_KEY = 'API KY HERE'

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY not found")

llm = GoogleGenerativeAI(
    model=MODEL_NAME,
    google_api_key=GOOGLE_API_KEY,
    temperature=TEMPERATURE,
)

JUDGE_PROMPT = """
You are a senior bioinformatics researcher specializing in
protein function annotation, domain architecture, homology inference,
and sequence-based biological reasoning.

Your task is to critically evaluate a generated answer produced by a
Retrieval-Augmented Generation (RAG) system.

You are given:
• A biological question
• A reference answer written or curated by a domain expert
• A generated answer produced by the system

Your goal is NOT to be generous.
Your goal is to be precise, skeptical, and scientifically grounded.

Focus on biological meaning, not wording.

-------------------------
SCORING PRINCIPLES
-------------------------

• Use the FULL 0–100 range
• Avoid clustering scores near 0 or 100 unless clearly justified
• Scores between 40–85 are expected for most real outputs
• Minor correctness issues should noticeably reduce the score
• Partial answers should NOT score above 70
• Incorrect biological claims must heavily penalize scores

-------------------------
SCORING DIMENSIONS (0–100)
-------------------------

1. Biological Correctness
   - Are the stated biological facts correct?
   - Penalize incorrect mechanisms, functions, domains, or annotations.

2. Semantic Alignment
   - Does the answer address the same biological question?
   - Penalize drift, partial relevance, or missing core intent.

3. Functional Completeness
   - Are the key biological aspects covered?
   - Missing major functional elements should strongly reduce this score.

4. Hallucination Control
   - Does the answer introduce unsupported biological claims?
   - Even ONE confident hallucination should reduce this score below 60.

-------------------------
SCORE ANCHORS
-------------------------

90–100: Expert-level, biologically precise, no errors  
75–89: Strong answer with minor omissions or imprecision  
60–74: Mostly correct but incomplete or vague  
40–59: Mixed quality; partial correctness with issues  
20–39: Largely incorrect or weak biological grounding  
0–19: Incorrect, misleading, or non-biological

-------------------------
OUTPUT FORMAT (STRICT JSON)
-------------------------

Return ONLY valid JSON. No markdown. No commentary.

{
  "biological_correctness": <int 0-100>,
  "semantic_alignment": <int 0-100>,
  "completeness": <int 0-100>,
  "hallucination_control": <int 0-100>,
  "overall_score": <int 0-100>,
  "justification": "<concise scientific justification (3–5 sentences)>"
}

IMPORTANT:
- The overall_score MUST be a weighted reflection of the four dimensions
- Do NOT simply average unless appropriate
"""


df = pd.read_excel(INPUT_EXCEL)

required_cols = {"question", "answer", "expected_output"}
missing = required_cols - set(df.columns)
if missing:
    raise ValueError(f"Missing required columns: {missing}")

OUTPUT_PATH = Path(OUTPUT_EXCEL)

per_sample_columns = [
    "question",
    "generated_answer",
    "expected_answer",
    "biological_correctness",
    "semantic_alignment",
    "completeness",
    "hallucination_free",
    "overall_score",
    "justification",
]

if not OUTPUT_PATH.exists():
    with pd.ExcelWriter(OUTPUT_EXCEL, engine="openpyxl") as writer:
        pd.DataFrame(columns=per_sample_columns).to_excel(
            writer, sheet_name="per_sample_scores", index=False
        )
        pd.DataFrame(
            columns=["metric", "mean", "std", "count"]
        ).to_excel(
            writer, sheet_name="overall_metrics", index=False
        )

def append_row_to_excel(excel_path, sheet_name, row_dict):
    wb = load_workbook(excel_path)
    ws = wb[sheet_name]

    df_row = pd.DataFrame([row_dict])
    for row in dataframe_to_rows(df_row, index=False, header=False):
        ws.append(row)

    wb.save(excel_path)

per_sample_rows = []

for _, row in tqdm(df.iterrows(), total=len(df)):
    prompt = f"""
Question:
{row['question']}

Expected answer:
{row['expected_output']}

Generated answer:
{row['answer']}

{JUDGE_PROMPT}
"""

    try:
        text = llm.invoke(prompt).strip()

        start = text.find("{")
        end = text.rfind("}") + 1

        if start == -1 or end == -1:
            raise ValueError("No JSON object found in model output")

        scores = json.loads(text[start:end])

    except Exception as e:
        scores = {
            "biological_correctness": None,
            "semantic_alignment": None,
            "completeness": None,
            "hallucination_free": None,
            "overall_score": None,
            "justification": f"ERROR: {e}",
        }

    row_result = {
        "question": row["question"],
        "generated_answer": row["answer"],
        "expected_answer": row["expected_output"],
        **scores,
    }

    append_row_to_excel(
        OUTPUT_EXCEL,
        sheet_name="per_sample_scores",
        row_dict=row_result,
    )

    per_sample_rows.append(row_result)

    time.sleep(SLEEP_BETWEEN_CALLS)

if per_sample_rows:
    per_sample_df = pd.DataFrame(per_sample_rows)

    metric_cols = [
        "biological_correctness",
        "semantic_alignment",
        "completeness",
        "hallucination_free",
        "overall_score",
    ]

    overall_metrics_df = (
        per_sample_df[metric_cols]
        .agg(["mean", "std", "count"])
        .transpose()
        .reset_index()
        .rename(columns={"index": "metric"})
    )

    with pd.ExcelWriter(
        OUTPUT_EXCEL,
        engine="openpyxl",
        mode="a",
        if_sheet_exists="replace",
    ) as writer:
        overall_metrics_df.to_excel(
            writer,
            sheet_name="overall_metrics",
            index=False,
        )

print("\nEvaluation complete.")
print(f"Saved Excel file: {OUTPUT_EXCEL}")
print("Sheet 1: per_sample_scores")
print("Sheet 2: overall_metrics")
