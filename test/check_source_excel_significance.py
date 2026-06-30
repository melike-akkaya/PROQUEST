from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import pandas as pd


REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_DEPS = REPO_ROOT / ".python-deps"
DOWNLOADS = Path(r"C:/Users/RAUF YANMAZ/Downloads")

try:
    if (LOCAL_DEPS / "scipy" / "__init__.py").is_file():
        sys.path.insert(0, str(LOCAL_DEPS))
except OSError:
    pass

try:
    from scipy import stats
except ImportError:
    stats = None


def copied_workbook(pattern: str) -> Path:
    matches = [path for path in DOWNLOADS.glob(pattern) if "kopya" in path.name]
    if not matches:
        raise FileNotFoundError(f"No copied workbook found for pattern: {pattern}")
    return sorted(matches, key=lambda path: path.stat().st_mtime, reverse=True)[0]


COMPARISON_SETS = {
    "all": [
        {
            "label": "ProteinChat (gpt-5-mini) vs Base LLM (gpt-5-mini), no input sequence",
            "rag": DOWNLOADS / "GPT_RAG_Analysis_evaluation (1).xlsx",
            "base": DOWNLOADS / "gpt-5-mini_outputs_evaluation (1).xlsx",
            "keys": ["question"],
        },
        {
            "label": "ProteinChat (gemini-3-flash-prev) vs Base LLM (gemini-3-flash-prev), no input sequence",
            "rag": DOWNLOADS / "Gemini_RAG_Analysis_evaluation (1).xlsx",
            "base": DOWNLOADS / "gemini-3-flash_outputs_evaluation (1).xlsx",
            "keys": ["question"],
        },
        {
            "label": "ProteinChat (gpt-5-mini) vs Base LLM (gpt-5-mini), with input sequence",
            "rag": DOWNLOADS / "GPT_RAG_Sequence_Search_Analysis_evaluation.xlsx",
            "base": DOWNLOADS / "gpt-5-mini_outputs_with_sequence_evaluation.xlsx",
            "keys": ["protein_accession"],
        },
        {
            "label": "ProteinChat (gemini-3-flash-prev) vs Base LLM (gemini-3-flash-prev), with input sequence",
            "rag": DOWNLOADS / "Gemini_RAG_Sequence_Search_Analysis_evaluation.xlsx",
            "base": DOWNLOADS / "gemini-3-flash_outputs_with_sequence_evaluation.xlsx",
            "keys": ["protein_accession"],
        },
    ],
    "dbde-olmayan": [
        {
            "label": "ProteinChat (gpt-5-mini) vs Base LLM (gpt-5-mini), DB-not-in-DB no input sequence",
            "rag": copied_workbook("GPT_RAG_Analysis_evaluation*.xlsx"),
            "base": copied_workbook("gpt-5-mini_outputs_evaluation*.xlsx"),
            "keys": ["question"],
        },
        {
            "label": "ProteinChat (gemini-3-flash-prev) vs Base LLM (gemini-3-flash-prev), DB-not-in-DB no input sequence",
            "rag": DOWNLOADS / "DBDEOLMAYAN-Gemini_RAG_Analysis_evaluation.xlsx",
            "base": DOWNLOADS / "DBDEOLMAYAN-gemini-3-flash_outputs_evaluation.xlsx",
            "keys": ["question"],
        },
        {
            "label": "ProteinChat (gpt-5-mini) vs Base LLM (gpt-5-mini), DB-not-in-DB with input sequence",
            "rag": copied_workbook("GPT_RAG_Sequence_Search_Analysis_evaluation*.xlsx"),
            "base": copied_workbook("gpt-5-mini_outputs_with_sequence_evaluation*.xlsx"),
            "keys": ["protein_accession"],
        },
        {
            "label": "ProteinChat (gemini-3-flash-prev) vs Base LLM (gemini-3-flash-prev), DB-not-in-DB with input sequence",
            "rag": DOWNLOADS / "DBDEOLMAYAN-Gemini_RAG_Sequence_Search_Analysis_evaluat.xlsx",
            "base": DOWNLOADS / "DBDEOLMAYAN-gemini-3-flash_outputs_with_sequence_evaluation.xlsx",
            "keys": ["protein_accession"],
        },
    ],
}


def load_scores(path: Path, keys: list[str], score_name: str) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name="per_sample_scores")
    df = df[df["question"].notna()].copy()
    df[score_name] = pd.to_numeric(df["overall_score"], errors="coerce")
    return df[keys + [score_name]].drop_duplicates(subset=keys, keep="first")


def fallback_wilcoxon(rag: pd.Series, base: pd.Series) -> tuple[float, float]:
    diff = rag.reset_index(drop=True) - base.reset_index(drop=True)
    diff = diff[diff != 0]
    if diff.empty:
        return 0.0, 1.0

    ranks = diff.abs().rank(method="average")
    w_plus = float(ranks[diff > 0].sum())
    w_minus = float(ranks[diff < 0].sum())
    statistic = min(w_plus, w_minus)
    n = len(diff)
    mean = n * (n + 1) / 4
    tie_counts = diff.abs().value_counts()
    tie_correction = sum((int(count) ** 3 - int(count)) for count in tie_counts if int(count) > 1) / 48
    variance = n * (n + 1) * (2 * n + 1) / 24 - tie_correction
    z = max(0.0, abs(w_plus - mean) - 0.5) / math.sqrt(variance)
    p_value = math.erfc(z / math.sqrt(2))
    return statistic, p_value


def wilcoxon(rag: pd.Series, base: pd.Series) -> tuple[float, float]:
    if stats is None:
        return fallback_wilcoxon(rag, base)

    result = stats.wilcoxon(
        rag.to_numpy(dtype=float),
        base.to_numpy(dtype=float),
        zero_method="wilcox",
        correction=True,
        alternative="two-sided",
        method="asymptotic",
    )
    return float(result.statistic), float(result.pvalue)


def run_comparison(item: dict[str, object]) -> dict[str, object]:
    rag = load_scores(item["rag"], item["keys"], "rag")
    base = load_scores(item["base"], item["keys"], "base")
    paired = rag.merge(base, on=item["keys"], how="inner").dropna(subset=["rag", "base"])
    diff = paired["rag"] - paired["base"]
    statistic, p_value = wilcoxon(paired["rag"], paired["base"])
    return {
        "comparison": item["label"],
        "paired_n": len(paired),
        "nonzero_n": int((diff != 0).sum()),
        "rag_gt_base": int((diff > 0).sum()),
        "rag_lt_base": int((diff < 0).sum()),
        "rag_eq_base": int((diff == 0).sum()),
        "median_delta": float(diff.median()),
        "w": statistic,
        "p": p_value,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=sorted(COMPARISON_SETS), default="all")
    args = parser.parse_args()

    for result in [run_comparison(item) for item in COMPARISON_SETS[args.dataset]]:
        print(result["comparison"])
        print(f"  n={result['paired_n']}, W={result['w']:.6g}, p={result['p']:.12g}")
        print(
            f"  nonzero_n={result['nonzero_n']}, "
            f"RAG>Base={result['rag_gt_base']}, "
            f"RAG<Base={result['rag_lt_base']}, "
            f"RAG=Base={result['rag_eq_base']}, "
            f"median_delta={result['median_delta']:.6g}"
        )


if __name__ == "__main__":
    main()
