import argparse
import json
import sqlite3
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_CANDIDATES = [
    REPO_ROOT / "backend" / "asset" / "protein_index2.db",
    REPO_ROOT / "asset" / "protein_index2.db",
]


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Analyze the raw flat file token distribution stored in the project SQLite database. "
            "By default the script measures only flat_files.content, prints descriptive statistics to the terminal, "
            "and saves CSV/JSON/histogram outputs."
        )
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=None,
        help="Path to protein_index2.db. If omitted, the script tries the common project locations.",
    )
    parser.add_argument(
        "--metric",
        choices=["content_tokens", "prompt_fragment_tokens"],
        default="content_tokens",
        help=(
            "Metric used for histogram and ranking output. "
            "'content_tokens' is the raw flat file analysis; "
            "'prompt_fragment_tokens' is an optional RAG-oriented diagnostic."
        ),
    )
    parser.add_argument(
        "--model",
        default="gpt-4o-mini",
        help="Tokenizer model name for tiktoken when available.",
    )
    parser.add_argument(
        "--encoding",
        default="cl100k_base",
        help="Fallback tiktoken encoding name when the given model is unknown.",
    )
    parser.add_argument(
        "--tokenizer-backend",
        choices=["auto", "tiktoken", "transformers"],
        default="auto",
        help="Tokenizer backend used for offline token counting.",
    )
    parser.add_argument(
        "--hf-model",
        default="gpt2",
        help="Transformers tokenizer model to use when backend=transformers or when auto falls back to transformers.",
    )
    parser.add_argument(
        "--bins",
        type=int,
        default=40,
        help="Number of histogram bins.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=15,
        help="How many of the largest flat files to print in the terminal summary.",
    )
    parser.add_argument(
        "--output-prefix",
        type=Path,
        default=REPO_ROOT / "test" / "artifacts" / "flat_file_token_usage",
        help="Output prefix used for CSV, JSON, and PNG files.",
    )
    parser.add_argument(
        "--show-plot",
        action="store_true",
        help="Display the histogram window in addition to saving it.",
    )
    return parser.parse_args()


def resolve_db_path(user_path):
    if user_path:
        candidate = user_path.expanduser().resolve()
        if candidate.exists():
            return candidate
        raise FileNotFoundError(f"Database file not found: {candidate}")

    for candidate in DEFAULT_DB_CANDIDATES:
        if candidate.exists():
            return candidate.resolve()

    joined = "\n".join(str(path) for path in DEFAULT_DB_CANDIDATES)
    raise FileNotFoundError(
        "Could not locate protein_index2.db. Checked these paths:\n"
        f"{joined}"
    )


def build_token_counter(backend, model_name, encoding_name, hf_model_name):
    if backend in {"auto", "tiktoken"}:
        try:
            import tiktoken

            try:
                encoder = tiktoken.encoding_for_model(model_name)
                resolved = f"tiktoken:model={model_name}"
            except KeyError:
                encoder = tiktoken.get_encoding(encoding_name)
                resolved = f"tiktoken:encoding={encoding_name}"

            def count_tokens(text):
                return len(encoder.encode(text or ""))

            return count_tokens, resolved
        except ImportError:
            if backend == "tiktoken":
                raise

    if backend in {"auto", "transformers"}:
        from transformers import AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(
            hf_model_name,
            use_fast=True,
            trust_remote_code=True,
        )

        def count_tokens(text):
            return len(tokenizer.encode(text or "", add_special_tokens=False))

        return count_tokens, f"transformers:model={hf_model_name}"

    raise RuntimeError(f"Unsupported tokenizer backend: {backend}")


def load_flat_file_rows(db_path):
    sql = """
        SELECT
            ff.file_id AS file_id,
            COALESCE(ffm.protein_id, '') AS protein_id,
            ff.content AS content
        FROM flat_files AS ff
        LEFT JOIN flat_files_mapping AS ffm
          ON ff.file_id = ffm.file_id
        ORDER BY ff.file_id
    """
    conn = sqlite3.connect(db_path)
    try:
        return pd.read_sql_query(sql, conn)
    finally:
        conn.close()


def format_prompt_fragment(protein_id, content):
    return f"Protein ID: {protein_id}\nContent: {content}"


def analyze_rows(df, count_tokens):
    analysis_rows = []
    total_rows = len(df.index)

    for idx, row in enumerate(df.itertuples(index=False), start=1):
        mapped_protein_id = str(row.protein_id or "").strip()
        protein_id = mapped_protein_id or f"file_id:{row.file_id}"
        content = row.content or ""
        prompt_fragment = format_prompt_fragment(protein_id, content)

        analysis_rows.append(
            {
                "file_id": row.file_id,
                "protein_id": protein_id,
                "uniprot_url": f"https://www.uniprot.org/uniprotkb/{mapped_protein_id}" if mapped_protein_id else "",
                "content_char_count": len(content),
                "content_line_count": content.count("\n") + 1 if content else 0,
                "content_tokens": count_tokens(content),
                "prompt_fragment_tokens": count_tokens(prompt_fragment),
            }
        )

        if idx % 1000 == 0 or idx == total_rows:
            print(f"Processed {idx:,}/{total_rows:,} flat files")

    return pd.DataFrame(analysis_rows)


def build_summary(series):
    return {
        "count": int(series.count()),
        "mean": float(series.mean()),
        "median": float(series.median()),
        "std": float(series.std(ddof=0)),
        "min": int(series.min()),
        "p75": float(series.quantile(0.75)),
        "p90": float(series.quantile(0.90)),
        "p95": float(series.quantile(0.95)),
        "p99": float(series.quantile(0.99)),
        "max": int(series.max()),
    }


def build_distribution(series, bins):
    counts, edges = np.histogram(series, bins=bins)
    rows = []
    for idx, count in enumerate(counts):
        rows.append(
            {
                "bin": idx + 1,
                "range_start": float(edges[idx]),
                "range_end": float(edges[idx + 1]),
                "count": int(count),
            }
        )
    return pd.DataFrame(rows)


def save_histogram(series, output_path, bins, title):
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.hist(series, bins=bins, color="#7283ec", edgecolor="white", alpha=0.9)
    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("Tokens", fontsize=12)
    ax.set_ylabel("Flat file count", fontsize=12)
    ax.grid(axis="y", linestyle="--", alpha=0.25)
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    return fig


def print_summary(summary, metric_name, tokenizer_label, db_path):
    title = "Flat File Content Token Summary" if metric_name == "content_tokens" else "Flat File Token Usage Summary"
    print(f"\n{title}")
    print("=" * 72)
    print(f"Database:   {db_path}")
    print(f"Tokenizer:  {tokenizer_label}")
    print(f"Metric:     {metric_name}")
    print(f"Count:      {summary['count']:,}")
    print(f"Mean:       {summary['mean']:.2f}")
    print(f"Median:     {summary['median']:.2f}")
    print(f"Std:        {summary['std']:.2f}")
    print(f"Min:        {summary['min']:,}")
    print(f"P75:        {summary['p75']:.2f}")
    print(f"P90:        {summary['p90']:.2f}")
    print(f"P95:        {summary['p95']:.2f}")
    print(f"P99:        {summary['p99']:.2f}")
    print(f"Max:        {summary['max']:,}")
    print("=" * 72)


def main():
    args = parse_args()
    db_path = resolve_db_path(args.db_path)
    output_prefix = args.output_prefix.expanduser().resolve()
    output_prefix.parent.mkdir(parents=True, exist_ok=True)

    count_tokens, tokenizer_label = build_token_counter(
        backend=args.tokenizer_backend,
        model_name=args.model,
        encoding_name=args.encoding,
        hf_model_name=args.hf_model,
    )

    print(f"Loading flat files from {db_path}")
    df = load_flat_file_rows(db_path)
    print(f"Loaded {len(df.index):,} rows")
    if args.metric == "content_tokens":
        print("Running independent flat file analysis on raw flat_files.content")
    else:
        print("Running prompt-oriented analysis on formatted RAG fragments")

    analyzed_df = analyze_rows(df, count_tokens)
    metric_series = analyzed_df[args.metric]
    summary = build_summary(metric_series)
    distribution_df = build_distribution(metric_series, bins=args.bins)

    print_summary(summary, args.metric, tokenizer_label, db_path)

    top_df = analyzed_df.sort_values(args.metric, ascending=False).head(args.top_n)
    print(f"\nTop {args.top_n} largest flat files by {args.metric}:")
    print(
        top_df[
            [
                "protein_id",
                "file_id",
                args.metric,
                "content_tokens",
                "prompt_fragment_tokens",
                "content_char_count",
            ]
        ].to_string(index=False)
    )

    print("\nHistogram bins:")
    print(distribution_df.to_string(index=False))

    details_csv_path = output_prefix.with_name(f"{output_prefix.name}_details.csv")
    distribution_csv_path = output_prefix.with_name(f"{output_prefix.name}_distribution.csv")
    summary_json_path = output_prefix.with_name(f"{output_prefix.name}_summary.json")
    histogram_png_path = output_prefix.with_name(f"{output_prefix.name}_{args.metric}_histogram.png")

    analyzed_df.to_csv(details_csv_path, index=False)
    distribution_df.to_csv(distribution_csv_path, index=False)
    with open(summary_json_path, "w", encoding="utf-8") as handle:
        json.dump(
            {
                "database": str(db_path),
                "tokenizer": tokenizer_label,
                "metric": args.metric,
                "summary": summary,
            },
            handle,
            indent=2,
        )

    fig = save_histogram(
        metric_series,
        histogram_png_path,
        bins=args.bins,
        title=f"Flat File Token Distribution ({args.metric})",
    )

    print("\nSaved outputs:")
    print(f"- {details_csv_path}")
    print(f"- {distribution_csv_path}")
    print(f"- {summary_json_path}")
    print(f"- {histogram_png_path}")

    if args.show_plot:
        plt.show()
    else:
        plt.close(fig)


if __name__ == "__main__":
    main()
