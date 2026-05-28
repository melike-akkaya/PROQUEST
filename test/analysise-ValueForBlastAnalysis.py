import pandas as pd
import numpy as np

file_path = "/home/g1-bbm-project/melike2/PROQUEST/test/blast_search_results.txt"

df = pd.read_csv(file_path, sep="\t")

evalue_cols = [col for col in df.columns if col.startswith("E-value")]

print(f"Found {len(evalue_cols)} E-value columns")

all_evalues = df[evalue_cols].values.flatten()

all_evalues = pd.to_numeric(all_evalues, errors="coerce")
all_evalues = all_evalues[~np.isnan(all_evalues)]

print("\n================ E-value Statistics ================")
print(f"Total E-values: {len(all_evalues)}")
print(f"Min E-value: {all_evalues.min():.2e}")
print(f"Max E-value: {all_evalues.max():.2e}")
print(f"Mean E-value: {all_evalues.mean():.2e}")
print(f"Median E-value: {np.median(all_evalues):.2e}")

bins = [
    0,
    1e-180,
    1e-100,
    1e-50,
    1e-20,
    1e-10,
    1e-5,
    1e-2,
    1,
    np.inf
]

labels = [
    "0 - 1e-180",
    "1e-180 - 1e-100",
    "1e-100 - 1e-50",
    "1e-50 - 1e-20",
    "1e-20 - 1e-10",
    "1e-10 - 1e-5",
    "1e-5 - 1e-2",
    "1e-2 - 1",
    "1 - inf"
]

binned = pd.cut(all_evalues, bins=bins, labels=labels, include_lowest=True)

distribution = binned.value_counts().sort_index()

print("\n================ E-value Distribution ================")
for label, count in distribution.items():
    print(f"{label:20s} : {count}")

print("\n================ Percentage Distribution ================")
for label, count in distribution.items():
    percent = (count / len(all_evalues)) * 100
    print(f"{label:20s} : {percent:.2f}%")