import os
import json
import time
from pathlib import Path

import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAI

INPUT_DIR = Path("/home/g1-bbm-project/melike2/PROQUEST/test/temp")

MODEL_NAME = "gemini-2.5-pro"
TEMPERATURE = 0.0
SLEEP_BETWEEN_CALLS = 1.2

load_dotenv()
GOOGLE_API_KEY = 'AIzaSyCbDeef1M6BtOszTdxx-mabk0EMirQ5LAA'

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY not found (set it in environment or .env)")

llm = GoogleGenerativeAI(
    model=MODEL_NAME,
    google_api_key=GOOGLE_API_KEY,
    temperature=TEMPERATURE,
)

JUDGE_PROMPT = """
You are a senior bioinformatics reviewer evaluating the output of a Retrieval-Augmented Generation (RAG) system.

You will receive:
- Question
- Expected Answer (ground truth, derived from UniProt-style annotations)
- Generated Answer (model output)

CORE EVALUATION RULES
1) Treat the Expected Answer as the PRIMARY ground truth for what must be covered.
2) Score based on agreement with the Expected Answer's stated facts and scope.
3) Do NOT use external biology knowledge to add missing facts.
4) However, DO distinguish between:
   (A) Contradictions / wrong claims (strong penalty)
   (B) Major scope drift (strong penalty)
   (C) Non-contradictory elaborations (mild-to-moderate penalty only)

IMPORTANT CALIBRATION (to avoid unfairly low scores)
- Many model answers include harmless extra context (e.g., general family names, common domain database IDs, generic mechanism phrasing).
- If extra statements do NOT contradict the Expected Answer and do NOT change the scope, they should NOT collapse the score.
- Only penalize "hallucination" heavily when the answer adds confident, specific claims that are not supported AND meaningfully change interpretation
  (e.g., wrong domain, wrong function, wrong mechanism, wrong protein identity, wrong organism, incorrect binding partners, incorrect pathway claims).

WHAT COUNTS AS A MAJOR PROBLEM
- Missing expected key items (domains/motifs/functions/processes) -> completeness penalty
- Incorrect replacements or contradictions vs Expected Answer -> correctness penalty
- Reframing the task (e.g., giving a full protein report when Expected is a short list) -> semantic alignment penalty
- Fabricated specificity: exact residue ranges, accession IDs, named partners/pathways not supported -> hallucination penalty (moderate to strong depending on volume/impact)

SCORING DIMENSIONS (0–100)
1) Biological Correctness:
   - 100: All stated biological claims are consistent with Expected Answer.
   - 70: Mostly consistent; minor ambiguous extras but no contradictions.
   - 40: Multiple incorrect claims or key contradictions.
   - 0–20: Largely wrong or conflicting.

2) Semantic Alignment:
   - 100: Same scope/format/intent as Expected Answer.
   - 70: Slightly more verbose but still answering the same thing.
   - 40: Noticeable drift (turns into a broader report/review).
   - 0–20: Different task or unrelated answer.

3) Functional Completeness:
   - 100: Covers all key points in Expected Answer.
   - 70: Misses 1 minor point.
   - 40: Misses multiple key points.
   - 0–20: Misses most/all key points.

4) Hallucination Control:
   - 100: No unsupported additions.
   - 80: A few non-contradictory extras (generic background or IDs) that do not change meaning.
   - 60: Several unsupported specifics (IDs, partners, residue ranges), but core meaning stays aligned.
   - 30–50: Many unsupported specifics or added claims that substantially expand scope.
   - 0–20: Extensive fabricated specificity or identity/pathway claims; answer dominated by unsupported content.

OVERALL SCORE (0–100)
Compute a weighted judgment (not a plain average):
- Biological Correctness: 35%
- Completeness: 30%
- Semantic Alignment: 20%
- Hallucination Control: 15%
If there are direct contradictions to Expected Answer, cap overall_score at 49.
If the answer is largely unrelated, overall_score must be <= 19.

JUSTIFICATION REQUIREMENTS
- 3–5 sentences max.
- Must explicitly mention: (1) key matches, (2) key misses/wrongs, (3) whether extras are harmless vs harmful.
- Do not cite external facts.

OUTPUT FORMAT (STRICT JSON ONLY)
Return ONLY valid JSON. No markdown. No extra text.

{
  "biological_correctness": <int 0-100>,
  "semantic_alignment": <int 0-100>,
  "completeness": <int 0-100>,
  "hallucination_control": <int 0-100>,
  "overall_score": <int 0-100>,
  "justification": "<3–5 sentences>"
}
"""


REQUIRED_COLS = {"question", "answer", "expected_output"}

PER_SAMPLE_COLUMNS = [
    "question",
    "generated_answer",
    "expected_answer",
    "biological_correctness",
    "semantic_alignment",
    "completeness",
    "hallucination_control",
    "overall_score",
    "justification",
]


def safe_extract_json(text: str) -> dict:
    """Extract the first JSON object from a model response."""
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in model output")
    return json.loads(text[start:end])


def evaluate_file(input_path: Path) -> Path:
    output_path = input_path.with_name(f"{input_path.stem}_evaluation.xlsx")

    df = pd.read_excel(input_path)
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(f"{input_path.name}: Missing required columns: {missing}")

    per_sample_rows = []

    for _, row in tqdm(df.iterrows(), total=len(df), desc=f"Scoring {input_path.name}"):
        prompt = f"""
Question:
{row['question']}

Expected answer:
{row['expected_output']}

Generated answer:
{row['answer']}

{JUDGE_PROMPT}
""".strip()

        try:
            text = llm.invoke(prompt)
            if hasattr(text, "content"):
                text = text.content
            scores = safe_extract_json(str(text))

            for k in ["biological_correctness", "semantic_alignment", "completeness",
                      "hallucination_control", "overall_score", "justification"]:
                scores.setdefault(k, None)

        except Exception as e:
            scores = {
                "biological_correctness": None,
                "semantic_alignment": None,
                "completeness": None,
                "hallucination_control": None,
                "overall_score": None,
                "justification": f"ERROR: {e}",
            }

        per_sample_rows.append(
            {
                "question": row["question"],
                "generated_answer": row["answer"],
                "expected_answer": row["expected_output"],
                **scores,
            }
        )

        time.sleep(SLEEP_BETWEEN_CALLS)

    per_sample_df = pd.DataFrame(per_sample_rows, columns=PER_SAMPLE_COLUMNS)

    metric_cols = [
        "biological_correctness",
        "semantic_alignment",
        "completeness",
        "hallucination_control",
        "overall_score",
    ]

    overall_metrics_df = (
        per_sample_df[metric_cols]
        .agg(["mean", "std", "count"])
        .transpose()
        .reset_index()
        .rename(columns={"index": "metric"})
    )

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        per_sample_df.to_excel(writer, sheet_name="per_sample_scores", index=False)
        overall_metrics_df.to_excel(writer, sheet_name="overall_metrics", index=False)

    return output_path


def main():
    if not INPUT_DIR.exists():
        raise FileNotFoundError(f"Input folder not found: {INPUT_DIR}")

    excel_files = sorted(INPUT_DIR.glob("*.xlsx"))
    excel_files = [p for p in excel_files if not p.stem.endswith("_evaluation")]

    if not excel_files:
        print(f"No input .xlsx files found in: {INPUT_DIR}")
        return

    for input_path in excel_files:
        try:
            out = evaluate_file(input_path)
            print(f"Saved: {out}")
        except Exception as e:
            print(f"FAILED on {input_path.name}: {e}")


if __name__ == "__main__":
    main()
